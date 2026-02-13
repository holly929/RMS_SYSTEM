
export type Payment = {
  id: string;
  amount: number;
  date: string;
  method: string;
};

export type Property = {
  id: string;
  'Property Name'?: string;
  'Owner Name'?: string;
  'Phone Number'?: string;
  'Type of Property'?: string;
  'Suburb'?: string;
  'Amount'?: number;
  created_at?: string;
  payments?: Payment[];
  [key: string]: any;
};

export type Bop = {
  id: string;
  'Phone Number'?: string;
  'NAME OF AREA COUNCIL'?: string;
  'NAME OF COMMUNITY'?: string;
  'BUSINESS NAME & ADD'?: string;
  'BUSINESS LOCATION'?: string;
  'NAME OF OWNER'?: string;
  'SEX OF OWNER'?: string;
  'BUSINESS CATEGORY'?: string;
  'DESCRIPTION OF BUSINESS'?: string;
  'AMOUNT'?: number;
  created_at?: string;
  payments?: Payment[];
  [key: string]: any;
}

export type BillStatus = 'Paid' | 'Pending' | 'Overdue' | 'Unbilled';

export type PropertyWithStatus = Property & {
  status: BillStatus;
};

export type BopWithStatus = Bop & {
  status: BillStatus;
};

export type Bill = {
  id: string;
  propertyId: string;
  propertySnapshot: Property | Bop; // This will be a JSONB field in Supabase
  generatedAt: string; // ISO Date string
  year: number;
  totalAmountDue: number;
  created_at?: string;
  billType: 'property' | 'bop';
};

export type PaymentBill = {
  type: 'property' | 'bop';
  data: Property | Bop;
}

export type RevenueData = {
  month: string;
  revenue: number;
};

export type PaymentStatusData = {
  name: 'Paid' | 'Pending' | 'Overdue' | 'Unbilled';
  value: number;
  fill: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Data Entry' | 'Viewer';
  password?: string;
  photoURL?: string;
  created_at?: string;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  twoFactorRecoveryCodes?: string[];
};

export type RevenueByPropertyType = {
  name: string;
  revenue: number;
};

export type ActivityLog = {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  details?: string;
};
