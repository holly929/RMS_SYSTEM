
import { Property, Bop, RevenueData, Payment } from './types';
import { store } from './store';

const mockPayments: Payment[] = [
  { id: 'pay-1', amount: 100, date: '2025-08-15T10:00:00Z', method: 'mtn' },
  { id: 'pay-2', amount: 50, date: '2025-09-01T14:30:00Z', method: 'vodafone' },
];

export const mockProperties: Property[] = store.properties;
export const mockBops: Bop[] = store.bops;


export const mockRevenue: RevenueData[] = [
  { month: 'Jan', revenue: 75000 },
  { month: 'Feb', revenue: 92000 },
  { month: 'Mar', revenue: 110000 },
  { month: 'Apr', revenue: 85000 },
  { month: 'May', revenue: 125000 },
  { month: 'Jun', revenue: 65000 },
];

export const mockPropertyDataForAI = ``;
export const mockComparablePropertiesForAI = ``;
