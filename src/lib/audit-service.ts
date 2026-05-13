// c:/Users/ANEH MATHEW/RMS_SYSTEM/src/lib/audit-service.ts

type AuditAction = 'RECEIPT_VIEWED' | 'RECEIPT_PRINTED' | 'PAYMENT_CREATED' | 'DATA_FETCHED' | 'ERROR_OCCURRED';

interface AuditEvent {
  timestamp: string;
  userId?: string; // Optional, if user is authenticated
  actionType: AuditAction;
  entityType?: string; // e.g., 'Payment', 'Property', 'Bop'
  entityId?: string;
  metadata?: Record<string, any>; // Additional context
}

export const logAuditEvent = async (event: AuditEvent) => {
  // In a real application, this would send an API request to your backend
  // e.g., using fetch or a dedicated API client.
  console.log('Audit Event:', event); // For demonstration, log to console
  // await fetch('/api/audit-logs', { method: 'POST', body: JSON.stringify(event), headers: { 'Content-Type': 'application/json' } });
};