
import type { Property, Bop } from '@/lib/types';
import { getPropertyValue } from './property-utils';

export type BillStatus = 'Paid' | 'Pending' | 'Overdue' | 'Unbilled';

/**
 * Calculates the total billed amount for a property (excluding payments).
 */
export function calculatePropertyTotalBill(property: Property): number {
    const rateableValue = Number(getPropertyValue(property, 'Rateable Value')) || 0;
    const rateImpost = Number(getPropertyValue(property, 'Rate Impost')) || 0;
    const sanitation = Number(getPropertyValue(property, 'Sanitation Charged')) || 0;
    const prevBalance = Number(getPropertyValue(property, 'Previous Balance')) || 0;
    
    const calculated = (rateableValue * rateImpost) + sanitation + prevBalance;
    
    // If the component-based calculation is 0, fallback to the flat 'Amount' field
    if (calculated === 0) {
        return Number(getPropertyValue(property, 'Amount')) || 0;
    }
    return calculated;
}

/**
 * Calculates the outstanding balance for an item (Property or BOP).
 */
export function calculateBalance(item: Property | Bop): number {
    const isProperty = 'Property No' in item || !('BUSINESS NAME & ADD' in item);
    
    const totalBill = isProperty 
        ? calculatePropertyTotalBill(item as Property)
        : Number(getPropertyValue(item, 'AMOUNT')) || 0;
        
    const initialPaid = isProperty
        ? Number(getPropertyValue(item, 'Total Payment')) || 0
        : Number(getPropertyValue(item, 'Payment')) || 0;
        
    const systemPayments = item.payments || [];
    const totalSystemPaid = systemPayments.reduce((sum, pay) => sum + pay.amount, 0);
    
    return totalBill - (initialPaid + totalSystemPaid);
}

export function getBillStatus(property: Property): BillStatus {
  const totalBill = calculatePropertyTotalBill(property);
  const balance = calculateBalance(property);

  if (totalBill <= 0) {
    return 'Unbilled';
  } 
  
  if (balance <= 0) {
    return 'Paid';
  }
  
  const initialPaid = Number(getPropertyValue(property, 'Total Payment')) || 0;
  const systemPaid = (property.payments || []).reduce((s, p) => s + p.amount, 0);

  return (initialPaid + systemPaid) > 0 ? 'Pending' : 'Overdue';
}

export function getBopBillStatus(bop: Bop): BillStatus {
  const amount = Number(getPropertyValue(bop, 'AMOUNT')) || 0;
  const balance = calculateBalance(bop);

  if (amount <= 0) {
    return 'Unbilled';
  }

  if (balance <= 0) {
    return 'Paid';
  }
  
  const initialPaid = Number(getPropertyValue(bop, 'Payment')) || 0;
  const systemPaid = (bop.payments || []).reduce((s, p) => s + p.amount, 0);

  return (initialPaid + systemPaid) > 0 ? 'Pending' : 'Overdue';
}
