

// This file acts as a centralized in-memory database for the application.
// All data contexts will read from and write to this single source of truth,
// ensuring that data is shared and consistent across all user sessions
// within the same server process.

import type { Property, Bop, Bill, User, Payment, ActivityLog } from './types';
import { PERMISSION_PAGES, type RolePermissions, type UserRole } from '@/context/PermissionsContext';
import { logAuditEvent } from './audit-service';

const STORE_KEY = 'rateease.store';

// --- Default Data ---

const defaultAdminUser: User = {
    id: 'user-0',
    name: 'Admin',
    email: 'admin@rateease.gov',
    role: 'Admin',
    password: 'password',
    photoURL: '',
    twoFactorEnabled: false,
    twoFactorSecret: undefined,
    twoFactorRecoveryCodes: undefined,
};

const defaultPermissions: RolePermissions = {
  Admin: {
    dashboard: true, properties: true, billing: true, bop: true, 'bop-billing': true, bills: true, defaulters: true, reports: true,
    users: true, settings: true, 'integrations': true, payment: true, 'activity-logs': true, 'summary-bill': true,
  },
  'Data Entry': {
    dashboard: true, properties: true, billing: true, bop: true, 'bop-billing': true, bills: true, defaulters: true, reports: true,
    users: false, settings: false, 'integrations': true, payment: true, 'activity-logs': false, 'summary-bill': true,
  },
  Viewer: {
    dashboard: true, properties: false, billing: false, bop: false, 'bop-billing': false, bills: false, defaulters: false, reports: false,
    users: false, settings: false, 'integrations': false, payment: true, 'activity-logs': false, 'summary-bill': false,
  },
};


// --- Central Store ---

interface AppStore {
    properties: Property[];
    propertyHeaders: string[];
    bops: Bop[];
    bopHeaders: string[];
    summaryBillWorkbook: { [sheetName: string]: { data: Bop[], headers: string[] } };
    bills: Bill[];
    users: User[];
    permissions: RolePermissions;
    activityLogs: ActivityLog[];
    settings: { [key: string]: any };
}

function getDefaultStore(): AppStore {
    return {
        properties: [
            {
                id: 'prop-1',
                'Property No': `PROP/${new Date().getFullYear()}/001`,
                'Property Name': 'Green Haven Apartments',
                'Owner Name': 'John Doe',
                'Phone Number': '0244123456',
                'Type of Property': 'Residential',
                'Suburb': 'Cantonments',
                'Amount': 1500.00,
                created_at: new Date().toISOString(),
                payments: []
            },
            {
                id: 'prop-2',
                'Property No': `PROP/${new Date().getFullYear()}/002`,
                'Property Name': 'Blue Sky Plaza',
                'Owner Name': 'Jane Smith',
                'Phone Number': '0555123456',
                'Type of Property': 'Commercial',
                'Suburb': 'Airport Residential',
                'Amount': 3500.00,
                created_at: new Date().toISOString(),
                payments: []
            },
            {
                id: 'prop-3',
                'Property No': `PROP/${new Date().getFullYear()}/003`,
                'Property Name': 'Red Leaf Industrial Park',
                'Owner Name': 'Michael Johnson',
                'Phone Number': '0209123456',
                'Type of Property': 'Industrial',
                'Suburb': 'Tema',
                'Amount': 5000.00,
                created_at: new Date().toISOString(),
                payments: []
            },
            {
                id: 'prop-4',
                'Property No': `PROP/${new Date().getFullYear()}/004`,
                'Property Name': 'Yellow Field Farm',
                'Owner Name': 'Sarah Williams',
                'Phone Number': '0544123456',
                'Type of Property': 'Agricultural',
                'Suburb': 'Akuse',
                'Amount': 1000.00,
                created_at: new Date().toISOString(),
                payments: []
            },
            {
                id: 'prop-5',
                'Property No': `PROP/${new Date().getFullYear()}/005`,
                'Property Name': 'Purple Grove Mixed Development',
                'Owner Name': 'David Brown',
                'Phone Number': '0277123456',
                'Type of Property': 'Mixed',
                'Suburb': 'East Legon',
                'Amount': 4000.00,
                created_at: new Date().toISOString(),
                payments: []
            }
        ],
        propertyHeaders: ['Property No', 'Property Name', 'Owner Name', 'Phone Number', 'Type of Property', 'Suburb', 'Amount'],
        bops: [],
        bopHeaders: ['BOP No', 'NAME OF AREA COUNCIL', 'NAME OF COMMUNITY', 'BUSINESS NAME & ADD', 'BUSINESS LOCATION', 'NAME OF OWNER', 'SEX OF OWNER', 'BUSINESS CATEGORY', 'DESCRIPTION OF BUSINESS', 'Phone Number', 'AMOUNT', 'Payment'],
        summaryBillWorkbook: {},
        bills: [],
        users: [defaultAdminUser],
        permissions: defaultPermissions,
        activityLogs: [],
        settings: {
            generalSettings: {
                systemName: 'RateEase',
                assemblyName: 'Kpandai District Assembly',
                postalAddress: 'Post Office Box 30, Kpandai',
                contactPhone: '071-26526/26525',
                email: 'Kpdaist@hotmail.com',
                gps: 'NA-0058-1615',
                poBox: '30',
                region: 'Northern Region'
            },
            appearanceSettings: {
                assemblyLogo: '',
                ghanaLogo: '',
                signature: '',
            },
            integrationsSettings: {
                arkeselApiKey: '',
                arkeselSenderId: 'KPDARMS',
            },
            smsSettings: {
                enableSmsOnNewProperty: true,
                newPropertyMessageTemplate: "Dear {{Owner Name}}, your property {{Property Name}} ({{Type of Property}}) in {{Suburb}} has been registered with {{Assembly Name}}. Amount: GHS {{Amount}}. Thank you.",
                enableSmsOnBillGenerated: true,
                billGeneratedMessageTemplate: "Your bill of GHS {{Amount}} for property {{Property Name}} in {{Suburb}} for the year {{Year}} is ready. Please contact {{Assembly Name}} to arrange payment. Thank you.",
                enableSmsOnNewBop: true,
                newBopMessageTemplate: "Dear {{NAME OF OWNER}}, your business {{BUSINESS NAME & ADD}} ({{BUSINESS CATEGORY}} - {{DESCRIPTION OF BUSINESS}}) in {{NAME OF COMMUNITY}} has been registered with {{Assembly Name}}. Amount: GHS {{AMOUNT}}. Thank you.",
                enableSmsOnPaymentReceived: true,
                paymentReceivedMessageTemplate: "Dear {{Owner Name}}, we have received your payment of GHS {{Amount}} for {{Property Name/Business}}. New balance: GHS {{Balance}}. Thank you for your contribution to {{Assembly Name}}.",
                enableSmsOnNewUser: false,
                newUserMessageTemplate: "Welcome {{name}}, your account for {{System Name}} at {{Assembly Name}} has been created. Your role: {{role}}. Please login with your email: {{email}}.",
            },
            billDisplaySettings: {
                showLogo: true,
                showSignature: true,
                showStamp: true,
                fontFamily: 'sans',
                fontSize: 10,
                showAssemblyLogo: true,
                showGhanaLogo: true,
                showSignature: true,
                accentColor: '#2980D1', // Default primary color
                showQrCode: true,
                footerText: "Thank you for your prompt payment. This receipt is computer generated and does not require a physical signature for validity.",
            },
        },
    };
}

let store: AppStore;
let storeInitialized = false;

function loadStore(): AppStore {
    if (typeof window === 'undefined') {
        return getDefaultStore();
    }
    
    if (storeInitialized && store) {
        return store;
    }

    try {
        const stored = window.localStorage.getItem(STORE_KEY);
        if (stored) {
            const parsedStore = JSON.parse(stored);
            const defaultStore = getDefaultStore();
            // Deep merge to ensure all nested default settings are present if missing
            const mergedSettings = {
                ...defaultStore.settings,
                ...parsedStore.settings,
                appearanceSettings: { // ensure all appearance settings are present
                    ...defaultStore.settings.appearanceSettings,
                    ...(parsedStore.settings?.appearanceSettings || {})
                },
                smsSettings: { // ensure all sms settings are present
                    ...defaultStore.settings.smsSettings,
                    ...(parsedStore.settings?.smsSettings || {})
                },
                integrationsSettings: { // ensure integration settings are merged
                    ...defaultStore.settings.integrationsSettings,
                    ...(parsedStore.settings?.integrationsSettings || {})
                },
                billDisplaySettings: { // ensure all bill display settings are present
                    ...defaultStore.settings.billDisplaySettings,
                    ...(parsedStore.settings?.billDisplaySettings || {})
                }
            };
            parsedStore.settings = mergedSettings;
            
            store = { ...defaultStore, ...parsedStore };

            storeInitialized = true;
            return store;
        }
    } catch (e) {
        console.error("Failed to load store from localStorage", e);
    }

    storeInitialized = true;
    store = getDefaultStore();
    return store;
}

store = loadStore();


export function saveStore() {
    if (typeof window !== 'undefined') {
        try {
            window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
        } catch (e) {
            console.error("Failed to save store to localStorage", e);
        }
    }
}

// This function is for the restore functionality.
export function forceSaveStore(data: any) {
    if (typeof window !== 'undefined') {
        try {
            window.localStorage.setItem(STORE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error("Failed to force save store to localStorage", e);
        }
    }
}

export function clearAllStoreData() {
    const defaults = getDefaultStore();
    store.properties = defaults.properties;
    store.bops = defaults.bops;
    store.bills = defaults.bills;
    store.activityLogs = defaults.activityLogs;
    store.summaryBillWorkbook = defaults.summaryBillWorkbook;
    saveStore();
}

/**
 * Exports the current store data as a JSON file and downloads it to the user's device.
 * Logs the event for auditing purposes.
 */
export function downloadBackup(user?: User) {
    const data = JSON.stringify(store, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const timestamp = new Date().toISOString();
    const filename = `rateease-backup-${timestamp.replace(/[:.]/g, '-')}.json`;
    
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Log the backup action internally
    const logEntry: ActivityLog = {
        id: `log-backup-${Date.now()}`,
        timestamp,
        userId: user?.id || 'system',
        userName: user?.name || 'System Admin',
        userEmail: user?.email || 'admin@rateease.gov',
        action: 'System Backup',
        details: `A full system data backup was downloaded: ${filename}`,
    };
    store.activityLogs = [logEntry, ...store.activityLogs];

    // Log the audit event
    logAuditEvent({
        timestamp,
        actionType: 'BACKUP_DOWNLOADED',
        userId: user?.id,
        metadata: { filename }
    });

    saveStore();
}

/**
 * Clears all payment history from properties and BOPs, effectively resetting the total revenue collected to zero.
 * @param user The user object of the person performing the reset for auditing purposes.
 * @param reason An optional reason for performing the revenue reset.
 */
export function resetRevenueCollected(user?: User, reason?: string) {
    store.properties = store.properties.map(p => ({ ...p, payments: [] }));
    store.bops = store.bops.map(b => ({ ...b, payments: [] }));
    
    const timestamp = new Date().toISOString();

    // 1. Internal Audit: Add to the store's activity log for UI visibility
    const logEntry: ActivityLog = {
        id: `log-rev-reset-${Date.now()}`,
        timestamp,
        userId: user?.id || 'system',
        userName: user?.name || 'System Admin',
        userEmail: user?.email || 'admin@rateease.gov',
        action: 'Revenue Reset',
        details: `Total revenue collected metrics were reset by clearing all historical payment data. ${reason ? `Reason: ${reason}` : ''}`,
    };
    store.activityLogs = [logEntry, ...store.activityLogs];

    // 2. Service-level Audit: Trigger the audit service (async)
    logAuditEvent({
        timestamp,
        actionType: 'REVENUE_RESET',
        userId: user?.id,
        metadata: { 
            message: 'Complete revenue reset performed.',
            reason: reason || 'No reason provided.'
        }
    });

    saveStore();
}

/**
 * Adds a new payment to a specified property or BOP item.
 * Updates the item's payment history, recalculates the balance, and logs the activity.
 * @param itemId The ID of the property or BOP to add the payment to.
 * @param itemType The type of item ('property' or 'bop').
 * @param paymentAmount The amount of the payment.
 * @param paymentMethod The method of payment (e.g., 'cash', 'mobile_money').
 * @param paymentDate The date of the payment.
 * @param user The user object of the person performing the action for auditing purposes.
 * @returns An object containing the updated item and the new balance after payment, or null if the item is not found.
 */
export function addPaymentToItem(
    itemId: string,
    itemType: 'property' | 'bop',
    paymentAmount: number,
    paymentMethod: string,
    paymentDate: Date,
    user?: User // For auditing
): { updatedItem: Property | Bop; balanceAfterPayment: number } | null {
    let item: Property | Bop | undefined;
    let initialAmountDue: number;

    if (itemType === 'property') {
        item = store.properties.find(p => p.id === itemId);
        initialAmountDue = getPropertyValue(item, 'Amount') || 0; // Assuming 'Amount' is the initial billed amount
    } else { // bop
        item = store.bops.find(b => b.id === itemId);
        initialAmountDue = getPropertyValue(item, 'AMOUNT') || 0; // Assuming 'AMOUNT' is the initial billed amount
    }

    if (!item) {
        console.error(`Item with ID ${itemId} not found for payment.`);
        return null;
    }

    const newPayment: Payment = {
        id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, // Unique ID for payment
        date: paymentDate.toISOString(),
        amount: paymentAmount,
        method: paymentMethod,
    };

    const updatedPayments = [...(item.payments || []), newPayment];
    const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
    const balanceAfterPayment = initialAmountDue - totalPaid;

    const updatedItem = { ...item, payments: updatedPayments };

    if (itemType === 'property') {
        store.properties = store.properties.map(p => p.id === itemId ? (updatedItem as Property) : p);
    } else {
        store.bops = store.bops.map(b => b.id === itemId ? (updatedItem as Bop) : b);
    }

    // Log activity and audit event (as implemented in previous steps)
    // The logEntry and logAuditEvent calls are already in the diff for resetRevenueCollected,
    // but should be adapted here for payment addition.
    const logEntry: ActivityLog = {
        id: `log-payment-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: user?.id || 'system',
        userName: user?.name || 'System Admin',
        userEmail: user?.email || 'admin@rateease.gov',
        action: 'Payment Added',
        details: `Manual payment of GHS ${paymentAmount.toFixed(2)} added for ${itemType} ID ${itemId}. New balance: GHS ${balanceAfterPayment.toFixed(2)}.`,
    };
    store.activityLogs = [logEntry, ...store.activityLogs];

    logAuditEvent({
        timestamp: new Date().toISOString(),
        actionType: 'PAYMENT_CREATED',
        entityType: itemType === 'property' ? 'Property' : 'Bop',
        entityId: itemId,
        userId: user?.id,
        metadata: {
            paymentId: newPayment.id,
            amount: paymentAmount,
            method: paymentMethod,
            balanceAfterPayment: balanceAfterPayment,
        }
    });

    saveStore();
    return { updatedItem, balanceAfterPayment };
}

// Re-export store to be used by contexts
export { store };
