
import type { Property, Bop } from '@/lib/types';

const ALIAS_MAP = {
    'Property Name': ['Property Name', 'Property Name', 'NAME TYPE OF PROPERTY', 'Business Name', 'BUSINESS NAME & ADD'],
    'Owner Name': ['Owner Name', 'Name of Owner', 'Rate Payer', 'ownername', 'NAME OF OWNER'],
    'Phone Number': ['Phone Number', 'Phone', 'Telephone', 'phonenumber', 'PHONE NUMBER', 'PHONE'],
    'Type of Property': ['Type of Property', 'Property Type', 'propertytype', 'NAME TYPE OF PROPERTY'],
    'Suburb': ['Suburb', 'LOCATION', 'Location', 'NAME OF COMMUNITY', 'Community'],
    'Amount': ['Amount', 'AMOUNT', 'Total Amount Due', 'Permit Fee'],
    'Property No': ['Property No', 'Property Number', 'propertyno'],
    'BOP No': ['BOP No', 'BOP Number', 'bopno'],
    'Valuation List No.': ['Valuation List No.', 'Valuation List Number', 'valuationlistno', 'Valuation Number'],
    'Account Number': ['Account Number', 'Acct No', 'accountnumber'],
    'Rateable Value': ['Rateable Value', 'rateablevalue'],
    'Rate Impost': ['Rate Impost', 'rateimpost'],
    'Sanitation Charged': ['Sanitation Charged', 'Sanitation', 'sanitationcharged'],
    'Previous Balance': ['Previous Balance', 'Prev Balance', 'Arrears', 'previousbalance', 'Arrears BF'],
    'Total Payment': ['Total Payment', 'Amount Paid', 'Payment', 'totalpayment'],
    'NAME OF AREA COUNCIL': ['NAME OF AREA COUNCIL', 'Area Council'],
    'NAME OF COMMUNITY': ['NAME OF COMMUNITY', 'Community'],
    'BUSINESS NAME & ADD': ['BUSINESS NAME & ADD', 'Business Name', 'Business Address'],
    'LOCATION': ['LOCATION', 'Location'],
    'SEX OF OWNER': ['SEX OF OWNER', 'Sex'],
    'BUSINESS CATEGORY': ['BUSINESS CATEGORY', 'Business Category'],
    'DESCRIPTION OF PROPERTY': ['DESCRIPTION OF PROPERTY', 'Property Description'],
} as const;

const STANDARD_ALIASES: Record<string, readonly string[]> = ALIAS_MAP;

export type StandardKey = keyof typeof ALIAS_MAP;

const normalize = (str: string) => (str || '').toLowerCase().replace(/[\s._-]/g, '');

/**
 * Attempts to find a matching StandardKey for a given raw header string.
 * @param header The raw header string from Excel.
 * @returns The matching StandardKey or undefined.
 */
export const findStandardKey = (header: string): StandardKey | undefined => {
    const normalizedHeader = normalize(header);

    for (const [key, aliases] of Object.entries(ALIAS_MAP)) {
        const standardKey = key as StandardKey;
        // Check exact match with standard key
        if (normalize(standardKey) === normalizedHeader) return standardKey;
        
        // Check aliases
        for (const alias of (aliases as readonly string[])) {
            if (normalize(alias) === normalizedHeader) return standardKey;
        }
    }
    return undefined;
};

/**
 * Gets a property value using a standardized key, searching through common aliases.
 * This function is designed to be robust against variations in Excel column headers.
 * @param property The property object to search within.
 * @param standardKey The standardized key for the value to retrieve (e.g., 'Owner Name').
 * @returns The found value, or undefined if not found.
 */
export const getPropertyValue = <T = any>(
    property: Property | Bop | null, 
    standardKey: StandardKey | (string & {})
): T | undefined => {
    if (!property) return undefined;

    // OPTIMIZATION: If the standardKey itself is an exact property key, return it immediately.
    // This skips all alias and fuzzy matching if the most direct match is available.
    const directValue = property[standardKey];
    if (directValue !== undefined && directValue !== null && String(directValue).trim() !== '') {
      return directValue as T;
    }

    const keyAliases: readonly string[] = STANDARD_ALIASES[standardKey] || [standardKey];
    const propertyKeys = Object.keys(property);
    const tokenize = (str: string): string[] => (str || '').toLowerCase().match(/\w+/g) || [];

    // --- Pass 1: Exact normalized match ---
    for (const alias of keyAliases) {
        const normalizedAlias = normalize(alias);
        for (const pKey of propertyKeys) {
            if (normalize(pKey) === normalizedAlias) {
                const value = property[pKey];
                if (value !== undefined && value !== null && String(value).trim() !== '') {
                    return value as T;
                }
            }
        }
    }
    
    // --- Pass 2: Substring inclusion on normalized keys ---
    for (const alias of keyAliases) {
        const normalizedAlias = normalize(alias);
        if (normalizedAlias.length < 3) continue;

        for (const pKey of propertyKeys) {
            const normalizedPKey = normalize(pKey);
            if (['id', 'status'].includes(normalizedPKey)) continue;

            if (normalizedPKey.includes(normalizedAlias) || normalizedAlias.includes(normalizedPKey)) {
                const value = property[pKey];
                if (value !== undefined && value !== null && String(value).trim() !== '') {
                    return value as T;
                }
            }
        }
    }

    // --- Pass 3: Token-based matching ---
    for (const alias of keyAliases) {
        const aliasTokens = tokenize(alias);
        if (aliasTokens.length === 0) continue;

        for (const pKey of propertyKeys) {
            if (['id', 'status'].includes(normalize(pKey))) continue;
            
            const pKeyTokens = tokenize(pKey);
            if (pKeyTokens.length === 0) continue;
            
            const allTokensFound = aliasTokens.every(aliasToken => (pKeyTokens as string[]).includes(aliasToken));

            if (allTokensFound) {
                 const value = property[pKey];
                if (value !== undefined && value !== null && String(value).trim() !== '') {
                    return value as T;
                }
            }
        }
    }

    return undefined;
};
