
'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, MessageSquare } from 'lucide-react';

import type { Property, Bop } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { SmsDeliveryProgress } from '@/lib/sms-delivery-progress';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getPropertyValue } from '@/lib/property-utils';
import { getBopBillStatus, getBillStatus } from '@/lib/billing-utils';

interface SmsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  selectedProperties: (Property | Bop)[];
}

const smsFormSchema = z.object({
  message: z.string().min(10, "Message must be at least 10 characters.").max(480, "Message is too long."),
});

export function SmsDialog({ isOpen, onOpenChange, selectedProperties }: SmsDialogProps) {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState("");
  
  const form = useForm<z.infer<typeof smsFormSchema>>({
    resolver: zodResolver(smsFormSchema),
    defaultValues: {
      message: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      const firstItem = selectedProperties[0];
      let isBop = false;
      let isDefaulter = false;

      if (firstItem && 'id' in firstItem) {
          isBop = !!getPropertyValue(firstItem, 'Business Name');
          const status = isBop ? getBopBillStatus(firstItem as Bop) : getBillStatus(firstItem as Property);
          isDefaulter = status === 'Overdue' || status === 'Pending';
      }

      let defaultMessage = "";
      if (isDefaulter) {
         defaultMessage = isBop
            ? "Dear {{Owner Name}}, your BOP payment of GHS {{Amount Owed}} for '{{Business Name}}' is overdue as of {{Date}}. Please contact the District Assembly."
            : "Dear {{Owner Name}}, your property rate payment of GHS {{Amount Owed}} for property '{{Property No}}' is overdue as of {{Date}}. Please contact the assembly to arrange payment.";
      } else {
        defaultMessage = "Dear {{Owner Name}}, this is a notification from the District Assembly regarding your property: {{Property No}}. Thank you.";
      }

      form.reset({ message: defaultMessage });
      setIsSending(false);
      setShowProgress(false);
      setSubmittedMessage("");
    }
  }, [isOpen, form, selectedProperties]);

  const recipientCount = selectedProperties.filter(p => getPropertyValue(p, 'Phone Number')).length;

  async function onSubmit(data: z.infer<typeof smsFormSchema>) {
    setSubmittedMessage(data.message);
    setShowProgress(true);
  }

  const handleComplete = (results: any[]) => {
    const successfulSends = results.filter(r => r.success).length;
    
    if (successfulSends > 0) {
      toast({
        title: 'SMS Delivery Complete',
        description: `Successfully dispatched ${successfulSends} messages.`,
      });
    }
    
    // Allow the user to see the final results for a few seconds before closing
    setTimeout(() => {
      onOpenChange(false);
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            Send Bulk SMS
          </DialogTitle>
          <DialogDescription>
            Compose a message to send to the {recipientCount} selected items with a valid phone number.
            You can use placeholders like {'{{Owner Name}}'}.
          </DialogDescription>
        </DialogHeader>
        {showProgress ? (
          <SmsDeliveryProgress 
            items={selectedProperties} 
            template={submittedMessage} 
            onComplete={handleComplete}
          />
        ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={6}
                      placeholder="Type your message here..."
                      disabled={isSending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSending || recipientCount === 0}>
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  `Send to ${recipientCount} recipients`
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
