
import type { Property, Bop } from '@/lib/types';

const STANDARD_ALIASES: Record<string, string[]> = {
    'Owner Name': ['Owner Name', 'Name of Owner', 'Rate Payer', 'ownername', 'NAME OF OWNER'],
    'Phone Number': ['Phone Number', 'Phone', 'Telephone', 'phonenumber', 'PHONE NUMBER'],
    'Town': ['Town'],
    'Suburb': ['Suburb'],
    'Property No': ['Property No', 'Property Number', 'propertyno'],
    'Valuation List No.': ['Valuation List No.', 'Valuation List Number', 'valuationlistno', 'Valuation Number'],
    'Account Number': ['Account Number', 'Acct No', 'accountnumber'],
    'Property Type': ['Property Type', 'propertytype', 'NAME TYPE OF PROPERTY'],
    'Rateable Value': ['Rateable Value', 'rateablevalue'],
    'Rate Impost': ['Rate Impost', 'rateimpost'],
    'Sanitation Charged': ['Sanitation Charged', 'Sanitation', 'sanitationcharged'],
    'Previous Balance': ['Previous Balance', 'Prev Balance', 'Arrears', 'previousbalance', 'Arrears BF'],
    'Total Payment': ['Total Payment', 'Amount Paid', 'Payment', 'totalpayment'],
    'AMOUNT': ['AMOUNT', 'Amount', 'Total Amount Due', 'Permit Fee'],
    'NAME OF AREA COUNCIL': ['NAME OF AREA COUNCIL', 'Area Council'],
    'NAME OF COMMUNITY': ['NAME OF COMMUNITY', 'Community'],
    'BUSINESS NAME & ADD': ['BUSINESS NAME & ADD', 'Business Name', 'Business Address'],
    'LOCATION': ['LOCATION', 'Location'],
    'SEX OF OWNER': ['SEX OF OWNER', 'Sex'],
    'BUSINESS CATEGORY': ['BUSINESS CATEGORY', 'Business Category'],
    'DESCRIPTION OF PROPERTY': ['DESCRIPTION OF PROPERTY', 'Property Description'],
    'NAME TYPE OF PROPERTY': ['NAME TYPE OF PROPERTY', 'Property Type'],
};

/**
 * Gets a property value using a standardized key, searching through common aliases.
 * This function is designed to be robust against variations in Excel column headers.
 * @param property The property object to search within.
 * @param standardKey The standardized key for the value to retrieve (e.g., 'Owner Name').
 * @returns The found value, or undefined if not found.
 */
export const getPropertyValue = (property: Property | Bop | null, standardKey: string): any => {
    if (!property) return undefined;

    const keyAliases = STANDARD_ALIASES[standardKey] || [standardKey];
    const propertyKeys = Object.keys(property);

    const normalize = (str: string) => (str || '').toLowerCase().replace(/[\s._-]/g, '');
    const tokenize = (str: string): string[] => (str || '').toLowerCase().match(/\w+/g) || [];

    // --- Pass 1: Exact normalized match ---
    for (const alias of keyAliases) {
        const normalizedAlias = normalize(alias);
        for (const pKey of propertyKeys) {
            if (normalize(pKey) === normalizedAlias) {
                const value = property[pKey];
                if (value !== undefined && value !== null && String(value).trim() !== '') {
                    return value;
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
                    return value;
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
                    return value;
                }
            }
        }
    }

    // Fallback for keys that might not be in the alias list but exist on the object
    const directValue = property[standardKey];
    if (directValue !== undefined && directValue !== null && String(directValue).trim() !== '') {
      return directValue;
    }

    return undefined;
};
