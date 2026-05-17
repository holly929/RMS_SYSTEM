'use client';

import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, PlusCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Bill, Payment } from '@/lib/types';
import { getPropertyValue } from '@/lib/property-utils';

interface PaymentHistoryDialogProps {
  bill: Bill | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddPayment?: (item: Property | Bop, type: 'property' | 'bop') => void;
}

const formatCurrency = (value: number) => `GHS ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatDate = (isoString: string) => new Date(isoString).toLocaleString('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function PaymentHistoryDialog({ bill, isOpen, onOpenChange, onAddPayment }: PaymentHistoryDialogProps) {
  const router = useRouter();
  const payments = bill?.propertySnapshot?.payments || [];

  const handlePrintHistoricalReceipt = (payment: Payment) => {
    if (!bill) return;
    
    // Calculate the balance at the time this specific payment was made
    const index = payments.findIndex(p => p.id === payment.id);
    const paymentsUntilThen = payments.slice(0, index + 1);
    const totalPaidUntilThen = paymentsUntilThen.reduce((sum, p) => sum + p.amount, 0);
    const initialAmountDue = getPropertyValue(bill.propertySnapshot, 'Amount') || getPropertyValue(bill.propertySnapshot, 'AMOUNT') || 0;
    const historicalBalance = initialAmountDue - totalPaidUntilThen;

    const receiptData = {
        payment,
        billedItem: bill.propertySnapshot,
        balanceAfterPayment: historicalBalance,
    };
    localStorage.setItem('receiptDetails', JSON.stringify(receiptData));
    router.push(`/receipt?receiptId=${payment.id}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Payment History</DialogTitle>
          <DialogDescription>
            A log of all payments made for this bill.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length > 0 ? (
                payments.map((payment: Payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.date)}</TableCell>
                    <TableCell className="capitalize">{payment.method}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(payment.amount)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handlePrintHistoricalReceipt(payment)}>
                        <Printer className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    No payments found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {onAddPayment && bill && (
          <div className="flex justify-end pt-4 border-t">
            <Button variant="secondary" onClick={() => onAddPayment(bill.propertySnapshot, bill.billType)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Payment
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
