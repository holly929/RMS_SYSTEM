'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Bop, Payment } from '@/lib/types';

interface BopPaymentHistoryDialogProps {
  bop: Bop | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddPayment?: (bop: Bop) => void;
}

const formatCurrency = (value: number) => `GHS ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatDate = (isoString: string) => new Date(isoString).toLocaleString('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function BopPaymentHistoryDialog({ bop, isOpen, onOpenChange, onAddPayment }: BopPaymentHistoryDialogProps) {
  const payments = bop?.payments || [];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Payment History</DialogTitle>
          <DialogDescription>
            A log of all payments made for this BOP record.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length > 0 ? (
                payments.map((payment: Payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.date)}</TableCell>
                    <TableCell className="capitalize">{payment.method}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(payment.amount)}</TableCell>
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
        {onAddPayment && bop && (
          <div className="flex justify-end pt-4 border-t">
            <Button variant="secondary" onClick={() => onAddPayment(bop)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Payment
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
