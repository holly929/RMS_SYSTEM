

import type { Property, Bill, Bop } from './types';
import { store } from './store';
import { getPropertyValue } from './property-utils';
import { toast } from '@/hooks/use-toast';

function compileTemplate(template: string, data: Property | Bop | Bill): string {
    if (!template) return '';
    const compiled = template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (match, key) => {
        
        if (key === 'Amount Owed') {
            let amountOwed = 0;
            if ('billType' in data && 'propertySnapshot' in data) { // It's a Bill
                amountOwed = data.totalAmountDue;
            } else { // It's a Property or BOP
                amountOwed = Number(getPropertyValue(data, 'AMOUNT') || getPropertyValue(data, 'Amount')) || 0;
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
        
        let value: any;
        if ('propertySnapshot' in data) { // It's a Bill object
            const bill = data as Bill;
            if (Object.prototype.hasOwnProperty.call(bill, key)) {
                value = (bill as any)[key];
            } else {
                value = getPropertyValue(bill.propertySnapshot, key);
            }
        } else { // It's a Property or Bop object
            value = getPropertyValue(data, key);
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

    try {
        const response = await fetch('/api/sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber: normalizedPhone, message }),
        });

        const result = await response.json();

        if (response.ok && result.success === true) {
            console.log(`SMS dispatched via backend for ${normalizedPhone}`);
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
export async function sendSms(items: (Property | Bop)[], messageTemplate: string): Promise<{ propertyId: string; success: boolean; error?: string }[]> {
    const smsPromises = items.map(async (item) => {
        // Check both field names for compatibility with old and new data
        const phoneNumber = getPropertyValue(item, 'PHONE NUMBER') || getPropertyValue(item, 'Phone Number');
        if (phoneNumber && String(phoneNumber).trim()) {
            const message = compileTemplate(messageTemplate, item);
            const result = await sendSingleSms(String(phoneNumber), message);
            return { propertyId: item.id, ...result };
        } else {
            return { propertyId: item.id, success: false, error: 'No phone number' };
        }
    });

    const results = await Promise.all(smsPromises);
    return results;
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

    const smsPromises = bills.map(bill => {
        // Check both field names for compatibility with old and new data
        const phoneNumber = getPropertyValue(bill.propertySnapshot, 'PHONE NUMBER') || getPropertyValue(bill.propertySnapshot, 'Phone Number');
        if (phoneNumber && String(phoneNumber).trim()) {
            const message = compileTemplate(billGeneratedMessageTemplate, bill);
            return sendSingleSms(String(phoneNumber), message);
        }
        return Promise.resolve({ success: false, error: 'No phone number' });
    });
    
    const results = await Promise.all(smsPromises);
    const sentCount = results.filter(r => r.success).length;
    const failedResults = results.filter(r => !r.success && r.error !== 'No phone number');

    if (sentCount > 0) {
        toast({
            title: 'Bill Notifications Sent',
            description: `Dispatched ${sentCount} SMS messages to property/business owners.`,
        });
    }

    if (failedResults.length > 0) {
        toast({
            variant: 'destructive',
            title: `${failedResults.length} SMS Notifications Failed`,
            description: `First error: ${failedResults[0].error}`,
        });
    }
}
