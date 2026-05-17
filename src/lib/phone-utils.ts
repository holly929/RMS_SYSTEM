/**
 * Normalizes Ghanaian phone number to international format (233...).
 * Handles formats: 024..., 23324..., and 9-digit formats starting with 2 or 5.
 * @param phone Phone number to normalize
 * @returns normalized phone number string
 */
export function normalizePhoneNumber(phone: string): string {
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

    // For debugging purposes, log the phone number format if it's clearly out of bounds
    if (cleaned.length > 0 && (cleaned.length < 9 || cleaned.length > 12)) {
        console.warn('Invalid Ghanaian phone number format detected:', phone);
    }
    
    return cleaned;
}

/**
 * Validates if a string follows a valid Ghanaian phone number format.
 * @param phone Number to validate
 * @returns boolean indicating if valid Ghanaian format
 */
export function isValidGhanaianPhoneNumber(phone: string): boolean {
    // Remove all non-digit characters
    const cleaned = String(phone || '').replace(/\D/g, '');
    
    // Valid formats: 02xxxxxxxxx (10 digits), 2332xxxxxxxxx (12 digits), or 2xxxxxxxxx (9 digits)
    return (
        (cleaned.startsWith('0') && cleaned.length === 10) ||
        (cleaned.startsWith('233') && cleaned.length === 12) ||
        (cleaned.length === 9 && (cleaned.startsWith('2') || cleaned.startsWith('5')))
    );
}