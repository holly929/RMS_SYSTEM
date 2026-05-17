// c:/Users/ANEH MATHEW/RMS_SYSTEM/src/components/add-payment-dialog.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ToastAction } from '@/components/ui/toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { addPaymentToItem } from '@/lib/store';
import { sendPaymentReceivedSms } from '@/lib/sms-service';
import type { Property, Bop, Payment } from '@/lib/types';
import { getPropertyValue } from '@/lib/property-utils';
import { useAuth } from '@/context/AuthContext'; // Assuming AuthContext provides current user

interface AddPaymentDialogProps {
  item: Property | Bop | null;
  itemType: 'property' | 'bop';
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onPaymentAdded?: (updatedItem: Property | Bop) => void;
}

const paymentFormSchema = z.object({
  amount: z.coerce.number().min(0.01, 'Amount must be greater than zero.'),
  method: z.string().min(1, 'Payment method is required.'),
  date: z.date({
    required_error: 'A payment date is required.',
  }),
});

export function AddPaymentDialog({ item, itemType, isOpen, onOpenChange, onPaymentAdded }: AddPaymentDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user: currentUser } = useAuth(); // Get current authenticated user for auditing
  const [isProcessing, setIsProcessing] = useState(false);

  const form = useForm<z.infer<typeof paymentFormSchema>>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: 0,
      method: '',
      date: new Date(),
    },
  });

  useEffect(() => {
    if (isOpen && item) {
      form.reset({
        amount: 0, // Reset amount to 0 for new payment
        method: '',
        date: new Date(),
      });
    }
  }, [isOpen, item, form]);

  const onSubmit = async (data: z.infer<typeof paymentFormSchema>) => {
    if (!item) return;

    setIsProcessing(true);
    try {
      const result = addPaymentToItem(item.id, itemType, data.amount, data.method, data.date, currentUser);

      if (result) {
        onPaymentAdded?.(result.updatedItem); // Notify parent component of the update

        // Construct a Payment object for sendPaymentReceivedSms
        const newPaymentForSms: Payment = {
            id: result.updatedItem.payments?.slice(-1)[0]?.id || '', // Get the ID of the newly added payment
            date: data.date.toISOString(),
            amount: data.amount,
            method: data.method,
        };

        // Prepare data for the Receipt Page
        const receiptDetails = {
            payment: newPaymentForSms,
            billedItem: result.updatedItem,
            balanceAfterPayment: result.balanceAfterPayment,
        };
        localStorage.setItem('receiptDetails', JSON.stringify(receiptDetails));

        // Send SMS notification
        await sendPaymentReceivedSms(result.updatedItem, newPaymentForSms, result.balanceAfterPayment);

        toast({
          title: 'Payment Added',
          description: `GHS ${data.amount.toFixed(2)} payment recorded for ${getPropertyValue(result.updatedItem, 'Property No') || getPropertyValue(result.updatedItem, 'BOP No')}.`,
          action: (
            <ToastAction altText="Print Receipt" onClick={() => router.push(`/receipt?receiptId=${newPaymentForSms.id}`)}>
              <Printer className="mr-2 h-4 w-4" /> Print Receipt
            </ToastAction>
          ),
        });
        onOpenChange(false);
      } else {
        throw new Error('Failed to add payment to store.');
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      toast({
        variant: 'destructive',
        title: 'Payment Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred while adding payment.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const itemIdentifier = item ? (getPropertyValue(item, 'Property No') || getPropertyValue(item, 'BOP No')) : 'N/A';
  const ownerName = item ? (getPropertyValue(item, 'Owner Name') || getPropertyValue(item, 'NAME OF OWNER')) : 'N/A';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Manual Payment</DialogTitle>
          <DialogDescription>
            Record a payment for {itemType === 'property' ? 'property' : 'BOP'} <strong>{itemIdentifier}</strong> (Owner: {ownerName}).
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (GHS)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="e.g., 150.00" {...field} disabled={isProcessing} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isProcessing}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      {/* Add more methods as needed */}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Payment Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={isProcessing}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    The date the payment was received.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
                Cancel
              </Button>
              <Button type="submit" disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding Payment...
                  </>
                ) : (
                  'Add Payment'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}