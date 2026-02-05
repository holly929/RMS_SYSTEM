
import type { Property, Bop } from '@/lib/types';
import { getPropertyValue } from './property-utils';

export type BillStatus = 'Paid' | 'Pending' | 'Overdue' | 'Unbilled';

export function getBillStatus(property: Property): BillStatus {
  const rateableValue = Number(getPropertyValue(property, 'Rateable Value')) || 0;
  const rateImpost = Number(getPropertyValue(property, 'Rate Impost')) || 0;
  const sanitationCharged = Number(getPropertyValue(property, 'Sanitation Charged')) || 0;
  const previousBalance = Number(getPropertyValue(property, 'Previous Balance')) || 0;
  const totalPayment = Number(getPropertyValue(property, 'Total Payment')) || 0;

  const grandTotalDue = (rateableValue * rateImpost) + sanitationCharged + previousBalance;

  if (grandTotalDue <= 0) {
    return 'Unbilled';
  } 
  
  if (totalPayment >= grandTotalDue) {
    return 'Paid';
  }

  if (totalPayment > 0) { // Implies totalPayment < grandTotalDue from previous check
    return 'Pending';
  }

  return 'Overdue'; // totalPayment <= 0 and grandTotalDue > 0
}

export function getBopBillStatus(bop: Bop): BillStatus {
  const amount = Number(getPropertyValue(bop, 'AMOUNT')) || 0;

  if (amount <= 0) {
    return 'Unbilled';
  }

  return 'Paid';
}
