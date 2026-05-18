import type { Property, Bop } from '@/lib/types';
import { getPropertyValue, type StandardKey } from './property-utils';

export type BillStatus = 'Paid' | 'Pending' | 'Overdue' | 'Unbilled';

/**
 * Calculates the total billed amount for a property (excluding payments).
 */
export function calculatePropertyTotalBill(property: Property): number {
    const rateableValue = getPropertyValue<number>(property, 'Rateable Value') || 0;
    const rateImpost = getPropertyValue<number>(property, 'Rate Impost') || 0;
    const sanitation = getPropertyValue<number>(property, 'Sanitation Charged') || 0;
    const prevBalance = getPropertyValue<number>(property, 'Previous Balance') || 0;
    
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
        : getPropertyValue<number>(item, 'Amount') || 0;
        
    const initialPaid = isProperty
        ? getPropertyValue<number>(item, 'Total Payment') || 0
        : getPropertyValue<number>(item, 'Total Payment') || 0;
        
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
  
  const initialPaid = getPropertyValue<number>(property, 'Total Payment') || 0;
  const systemPaid = (property.payments || []).reduce((s, p) => s + p.amount, 0);

  return (initialPaid + systemPaid) > 0 ? 'Pending' : 'Overdue';
}

export function getBopBillStatus(bop: Bop): BillStatus {
  const amount = getPropertyValue<number>(bop, 'Amount') || 0;
  const balance = calculateBalance(bop);

  if (amount <= 0) {
    return 'Unbilled';
  }

  if (balance <= 0) {
    return 'Paid';
  }
  
  const initialPaid = getPropertyValue<number>(bop, 'Total Payment') || 0;
  const systemPaid = (bop.payments || []).reduce((s, p) => s + p.amount, 0);

  return (initialPaid + systemPaid) > 0 ? 'Pending' : 'Overdue';
}
