

// This file acts as a centralized in-memory database for the application.
// All data contexts will read from and write to this single source of truth,
// ensuring that data is shared and consistent across all user sessions
// within the same server process.

import type { Property, Bop, Bill, User, Payment, ActivityLog } from './types';
import { PERMISSION_PAGES, type RolePermissions, type UserRole } from '@/context/PermissionsContext';

const STORE_KEY = 'rateease.store';

// --- Default Data ---

const defaultAdminUser: User = {
    id: 'user-0',
    name: 'Admin',
    email: 'admin@rateease.gov',
    role: 'Admin',
    password: 'password',
    photoURL: '',
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
        propertyHeaders: ['Property Name', 'Owner Name', 'Phone Number', 'Type of Property', 'Suburb', 'Amount'],
        bops: [],
        bopHeaders: ['Business Name', 'Owner Name', 'Phone Number', 'Town', 'Permit Fee', 'Payment'],
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
            appearanceSettings: {},
            integrationsSettings: {},
            smsSettings: {
                enableSmsOnNewProperty: true,
                newPropertyMessageTemplate: "Dear {{NAME OF OWNER}}, your property ({{No}}) has been registered with {{Assembly Name}}. Thank you.",
                enableSmsOnBillGenerated: true,
                billGeneratedMessageTemplate: "Your bill of GHS {{AMOUNT}} for property {{No}} for the year {{Year}} is ready. Please contact {{Assembly Name}} to arrange payment. Thank you.",
            },
            billDisplaySettings: {},
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
        // Clear existing data to ensure we use the new default properties
        window.localStorage.removeItem(STORE_KEY);
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

// Re-export store to be used by contexts
export { store };
