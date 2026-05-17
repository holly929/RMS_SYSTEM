

import type { Property, Bill, Bop, Payment, User, ActivityLog } from './types';
import { store, saveStore } from './store';
import { getPropertyValue } from './property-utils';
import { toast } from '@/hooks/use-toast';
import { logAuditEvent } from './audit-service';
 
const SMS_CHUNK_SIZE = 50; // Process in batches of 50 to avoid timeouts

function compileTemplate(template: string, data: Record<string, any>): string {
    if (!template) return '';
    const compiled = template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (match, key) => {
        
        if (key === 'Amount Owed' || key === 'Balance') {
            let amountOwed = 0;
            if ('billType' in data && 'propertySnapshot' in data) { // It's a Bill
                amountOwed = data.totalAmountDue;
            } else { // It's a Property or BOP
                // Check if specific Balance key is provided in context (for payments)
                amountOwed = data[key] !== undefined ? Number(data[key]) : (Number(getPropertyValue(data as any, 'AMOUNT') || getPropertyValue(data as any, 'Amount')) || 0);
            }
            return amountOwed.toFixed(2);
        }

        if (key === 'Date') {
            return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        }

        if (key === 'Year') {
            return new Date().getFullYear().toString();
        }

        if (key === 'Assembly Name') {
            return store.settings.generalSettings?.assemblyName || 'The District Assembly';
        }
        
        if (key === 'System Name') {
            return store.settings.generalSettings?.systemName || 'RateEase';
        }

        let value: any;
        // Prioritize direct properties from the data object
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            value = data[key];
        } else if ('propertySnapshot' in data && data.propertySnapshot && Object.prototype.hasOwnProperty.call(data.propertySnapshot, key)) {
            // If it's a Bill-like object with a propertySnapshot, check there
            value = data.propertySnapshot[key];
        } else {
            // Fallback to getPropertyValue for nested/dynamic keys if not found directly
            // This is primarily for Property/Bop fields that might be dynamic
            value = getPropertyValue(data as any, key); 
        }


        
        if (typeof value === 'number' && ['totalAmountDue', 'Rateable Value', 'Total Payment', 'Permit Fee', 'Payment', 'AMOUNT', 'Amount'].includes(key)) {
            return value.toFixed(2);
        }
        
        return value !== null && value !== undefined ? String(value) : '';
    });
    return compiled;
}


/**
 * Dispatches a request to the internal backend API to send an SMS.
 * @param phoneNumber The recipient's phone number.
 * @param message The message to send.
 * @returns A promise that resolves to an object with success status and optional error.
 */
async function sendSingleSms(phoneNumber: string, message: string): Promise<{ success: boolean; error?: string }> {
    if (!message) {
        const error = 'SMS message is empty. Cannot send.';
        console.error(error);
        return { success: false, error };
    }

    // Validate and format phone number
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    if (!isValidGhanaianPhoneNumber(normalizedPhone)) {
        const error = `Invalid phone number format: ${phoneNumber}`;
        console.error(error);
        return { success: false, error };
    }

    const integrationConfig = store.settings.integrationsSettings || {};

    try {
        const response = await fetch('/api/sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                phoneNumber: normalizedPhone, 
                message,
                apiKey: integrationConfig.arkeselApiKey,
                senderId: integrationConfig.arkeselSenderId
            }),
        });

        const result = await response.json();

        if (response.ok && result.success === true) {
            console.log(`SMS dispatched via backend for ${normalizedPhone}`);
            await logAuditEvent({
                timestamp: new Date().toISOString(),
                actionType: 'DATA_FETCHED', // Using as 'Notification Sent' context
                entityType: 'SMS',
                metadata: { recipient: normalizedPhone, status: 'success' }
            });
            return { success: true };
        } else {
            const errorMessage = result.error || `An unknown error occurred (status: ${response.status}).`;
            console.error(`Backend SMS API error for ${normalizedPhone}:`, errorMessage, result.details);
            return { success: false, error: errorMessage };
        }
    } catch (error) {
        const errorMessage = 'Could not connect to the SMS service.';
        console.error(`Failed to call internal SMS API for ${phoneNumber}:`, error);
        return { success: false, error: errorMessage };
    }
}

/**
 * Validates Ghanaian phone number format.
 * @param phone Number to validate
 * @returns boolean indicating if valid Ghanaian format
 */
function isValidGhanaianPhoneNumber(phone: string): boolean {
    // Remove all non-digit characters
    const cleaned = String(phone || '').replace(/\D/g, '');
    
    // Valid formats: 02xxxxxxxxx (10 digits), 2332xxxxxxxxx (12 digits), or 2xxxxxxxxx (9 digits)
    return (
        (cleaned.startsWith('0') && cleaned.length === 10) ||
        (cleaned.startsWith('233') && cleaned.length === 12) ||
        (cleaned.length === 9 && (cleaned.startsWith('2') || cleaned.startsWith('5')))
    );
}

/**
 * Normalizes Ghanaian phone number to international format without country code prefix.
 * @param phone Phone number to normalize
 * @returns normalized phone number (e.g., 233244123456)
 */
function normalizePhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const cleaned = String(phone || '').replace(/\D/g, '');
    
    if (cleaned.startsWith('0') && cleaned.length === 10) {
        // Replace leading '0' with '233' for Ghanaian numbers (e.g., 024... -> 23324...)
        return '233' + cleaned.substring(1);
    }
    
    if (cleaned.startsWith('233') && cleaned.length === 12) {
        // Already in correct format
        return cleaned;
    }
    
    if (cleaned.length === 9 && (cleaned.startsWith('2') || cleaned.startsWith('5'))) {
        // If we have 9 digits starting with 2 or 5, add country code
        return '233' + cleaned;
    }
    
    return cleaned;
}


/**
 * Sends SMS to multiple properties with a custom message.
 * Used for bulk messaging.
 * @param items An array of properties or BOPs to send SMS to.
 * @param messageTemplate The custom message template.
 * @returns An array of results for each attempt.
 */
export async function sendSms(
    items: (Property | Bop)[], 
    messageTemplate: string,
    onProgress?: (processed: number, total: number) => void
): Promise<{ propertyId: string; success: boolean; error?: string; timestamp: string }[]> {
    const tasks = items.map(item => {
        const phoneNumber = getPropertyValue(item, 'PHONE NUMBER') || getPropertyValue(item, 'Phone Number');
        if (!phoneNumber || !String(phoneNumber).trim()) return { propertyId: item.id, error: 'No phone number' };
        return { propertyId: item.id, to: String(phoneNumber), message: compileTemplate(messageTemplate, item) };
    });

    const validTasks = tasks.filter(t => 'to' in t) as { propertyId: string; to: string; message: string }[];
    const finalResults: { propertyId: string; success: boolean; error?: string; timestamp: string }[] = tasks.map(t => 
        'error' in t ? { propertyId: t.propertyId, success: false, error: t.error, timestamp: new Date().toISOString() } : (null as any)
    ).filter(Boolean);

    if (validTasks.length === 0) return finalResults;

    const config = store.settings.integrationsSettings || {};
    
    // Process in chunks
    for (let i = 0; i < validTasks.length; i += SMS_CHUNK_SIZE) {
        const chunk = validTasks.slice(i, i + SMS_CHUNK_SIZE);
        const isPersonalized = messageTemplate.includes('{{');
        const firstMsg = chunk[0].message;
        const allSame = !isPersonalized || chunk.every(t => t.message === firstMsg);

        try {
            const payload: any = { apiKey: config.arkeselApiKey, senderId: config.arkeselSenderId };
            if (allSame) {
                payload.message = firstMsg;
                payload.recipients = chunk.map(t => t.to);
            } else {
                payload.batch = chunk.map(t => ({ to: t.to, message: t.message }));
            }

            const response = await fetch('/api/sms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await response.json();

            const attemptTimestamp = new Date().toISOString();
            chunk.forEach(task => {
                if (allSame) {
                    finalResults.push({ 
                        propertyId: task.propertyId, 
                        success: result.success, 
                        error: result.error,
                        timestamp: attemptTimestamp 
                    });
                } else {
                    const normalizedTo = normalizePhoneNumber(task.to);
                    const batchResult = result.results?.find((r: any) => r.to === normalizedTo);
                    finalResults.push({ 
                        propertyId: task.propertyId, 
                        success: batchResult?.success ?? result.success ?? false, 
                        error: batchResult?.error || result.error,
                        timestamp: attemptTimestamp 
                    });
                }
            });
        } catch (error) {
            const errorTimestamp = new Date().toISOString();
            chunk.forEach(task => {
                finalResults.push({ 
                    propertyId: task.propertyId, 
                    success: false, 
                    error: 'Network failure',
                    timestamp: errorTimestamp 
                });
            });
        }

        if (onProgress) {
            onProgress(Math.min(i + SMS_CHUNK_SIZE, validTasks.length), validTasks.length);
        }
    }

    // Log the entire batch with individual timestamps for auditing
    const successCount = finalResults.filter(r => r.success).length;
    const totalCount = items.length;

    await logAuditEvent({
        timestamp: new Date().toISOString(),
        actionType: 'DATA_FETCHED',
        entityType: 'SMS_BATCH',
        metadata: { 
            total: totalCount,
            success: successCount,
            results: finalResults 
        }
    });

    const logEntry: ActivityLog = {
        id: `log-sms-batch-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: 'system',
        userName: 'System Admin',
        userEmail: 'admin@rateease.gov',
        action: 'Bulk SMS Sent',
        details: `Batch completed: ${successCount}/${totalCount} messages sent. Individual timestamps recorded in system audit logs.`,
    };
    store.activityLogs = [logEntry, ...store.activityLogs];
    saveStore();

    return finalResults;
}

/**
 * Sends a notification when a new property or BOP is created.
 * Triggered from the PropertyDataContext or BopDataContext.
 * @param item The newly created property or BOP.
 */
export async function sendNewPropertySms(item: Property | Bop) {
    const config = store.settings.smsSettings || {};
    
     // Determine if it's a Property or BOP
     const isBop = 'BUSINESS NAME & ADD' in item;
    
    let enableSms: boolean;
    let messageTemplate: string;
    let itemType: string;
    
    if (isBop) {
        enableSms = config.enableSmsOnNewBop || false;
        messageTemplate = config.newBopMessageTemplate || '';
        itemType = 'BOP';
    } else {
        enableSms = config.enableSmsOnNewProperty || false;
        messageTemplate = config.newPropertyMessageTemplate || '';
        itemType = 'Property';
    }

    if (!enableSms || !messageTemplate) {
        return;
    }

    // Check both field names for compatibility with old and new data
    const phoneNumber = getPropertyValue(item, 'PHONE NUMBER') || getPropertyValue(item, 'Phone Number');
    if (!phoneNumber || !String(phoneNumber).trim()) {
        console.log(`Skipping new ${itemType} SMS: No phone number found for ${itemType} ID`, item.id);
        return;
    }

    const message = compileTemplate(messageTemplate, item);
    const result = await sendSingleSms(String(phoneNumber), message);
    
    if(result.success) {
        toast({
            title: 'SMS Notification Sent',
            description: `A welcome message was sent to ${phoneNumber}.`,
        });
    } else {
        toast({
            variant: 'destructive',
            title: 'SMS Sending Failed',
            description: result.error || `Could not send SMS to ${phoneNumber}.`,
        });
        console.error(`Failed to send automated new ${itemType} SMS to ${phoneNumber}.`);
    }
}

/**
 * Sends notifications when new bills are generated.
 * Triggered from the BillDataContext.
 * @param bills An array of newly created bills.
 */
export async function sendBillGeneratedSms(bills: Bill[]) {
    const config = store.settings.smsSettings || {};
    const { enableSmsOnBillGenerated, billGeneratedMessageTemplate } = config;

    if (!enableSmsOnBillGenerated || !billGeneratedMessageTemplate) {
        return;
    }

    const items = bills.map(b => b.propertySnapshot);
    const results = await sendSms(items, billGeneratedMessageTemplate);
    
    const sentCount = results.filter(r => r.success).length;
    const failedCount = results.length - sentCount;

    if (sentCount > 0) {
        toast({
            title: 'Bill Notifications Sent',
            description: `Successfully sent ${sentCount} messages.`,
        });
    }
}

/**
 * Sends a notification when a payment is received for a property or BOP.
 * Triggered after a successful payment (online or manual).
 * @param item The updated Property or BOP object.
 * @param payment The specific payment that was just made.
 * @param newBalance The balance after this payment.
 */
export async function sendPaymentReceivedSms(item: Property | Bop, payment: Payment, newBalance: number) {
    const config = store.settings.smsSettings || {};
    const { enableSmsOnPaymentReceived, paymentReceivedMessageTemplate } = config;

    if (!enableSmsOnPaymentReceived || !paymentReceivedMessageTemplate) {
        console.log(`Skipping payment received SMS: Feature disabled or template missing.`);
        return;
    }

    let ownerName = '';
    let itemName = '';
    let phoneNumber = '';

    const isProperty = 'Property Name' in item;
    
    ownerName = isProperty ? (getPropertyValue(item, 'Owner Name') || '') : (getPropertyValue(item, 'NAME OF OWNER') || '');
    itemName = isProperty ? (getPropertyValue(item, 'Property Name') || '') : (getPropertyValue(item, 'BUSINESS NAME & ADD') || '');
    phoneNumber = getPropertyValue(item, 'Phone Number') || getPropertyValue(item, 'PHONE NUMBER') || '';

    if (!phoneNumber || !String(phoneNumber).trim()) {
        console.log(`Skipping payment received SMS: No phone number found for item ID`, item.id);
        return;
    }

    const templateData = {
        ...item, // Include all item properties
        'Owner Name': ownerName,
        'Property Name/Business': itemName, // Generic placeholder
        'Amount': payment.amount, // Amount of the current payment
        'Balance': newBalance, // New calculated balance
    };

    const message = compileTemplate(paymentReceivedMessageTemplate, templateData);
    const result = await sendSingleSms(String(phoneNumber), message);

    if (result.success) {
        toast({ title: 'SMS Notification Sent', description: `Payment receipt message sent to ${phoneNumber}.` });
    } else {
        toast({ variant: 'destructive', title: 'SMS Sending Failed', description: result.error || `Could not send payment receipt SMS to ${phoneNumber}.` });
        console.error(`Failed to send automated payment received SMS to ${phoneNumber}.`);
    }
}

/**
 * Sends a welcome notification when a new system user (staff) is registered.
 * @param user The newly created User object.
 */
export async function sendNewUserSms(user: User) {
    const config = store.settings.smsSettings || {};
    const { enableSmsOnNewUser, newUserMessageTemplate } = config;

    if (!enableSmsOnNewUser || !newUserMessageTemplate) {
        return;
    }

    // System users might not have a phone number field in the basic User type, 
    // but if one is added or parsed from another field, we use it here.
    // For now, we assume user object might contain a phone or use the name as fallback for logs.
    const phoneNumber = (user as any).phone || (user as any).phoneNumber;

    if (!phoneNumber || !String(phoneNumber).trim()) {
        console.log(`Skipping new user SMS: No phone number found for user`, user.name);
        return;
    }

    const message = compileTemplate(newUserMessageTemplate, user);
    const result = await sendSingleSms(String(phoneNumber), message);

    if (result.success) {
        toast({
            title: 'Welcome SMS Sent',
            description: `A registration message was sent to ${user.name}.`,
        });
    } else {
        console.error(`Failed to send automated new user SMS to ${user.name}:`, result.error);
        toast({
            variant: 'destructive',
            title: 'SMS Failed',
            description: 'The welcome SMS could not be delivered.',
        });
    }
}
