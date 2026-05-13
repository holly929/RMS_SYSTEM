'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Payment, Property, Bop } from '@/lib/types';
import { getPropertyValue } from '@/lib/property-utils';
import { logAuditEvent } from '@/lib/audit-service';

const formatCurrency = (value: number) => `GHS ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ReceiptPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [receiptData, setReceiptData] = useState<{
        payment: Payment;
        billedItem: Property | Bop;
        balanceAfterPayment: number;
    } | null>(null);

    useEffect(() => {
        const fetchReceiptDetails = async () => {
            const receiptId = searchParams.get('receiptId');
            if (!receiptId) {
                logAuditEvent({
                    timestamp: new Date().toISOString(),
                    actionType: 'ERROR_OCCURRED',
                    metadata: { message: 'No receipt ID found in URL for ReceiptPage.', path: window.location.pathname }
                });
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'No receipt ID found. Please go back and try again.',
                });
                router.push('/'); // Redirect if no ID
                return;
            }

            try {
                // Replace this with your actual API call to fetch receipt details
                // Example: const response = await fetch(`/api/payments/${receiptId}`);
                // For now, simulating with localStorage as a fallback/demonstration,
                // but this should ideally be removed for production.
                const storedReceiptDetails = localStorage.getItem('receiptDetails');
                localStorage.removeItem('receiptDetails'); // Clear temporary storage after use

                if (storedReceiptDetails) {
                    const data = JSON.parse(storedReceiptDetails);
                    // Basic validation to ensure data matches expected structure
                    if (data && data.payment && data.billedItem && typeof data.balanceAfterPayment === 'number') {
                        setReceiptData(data);
                        logAuditEvent({
                            timestamp: new Date().toISOString(),
                            actionType: 'RECEIPT_VIEWED',
                            entityType: 'Payment',
                            entityId: data.payment.id,
                            metadata: { receiptId, source: 'localStorage' } // Include source for auditing
                        });
                    } else {
                        throw new Error('Invalid receipt data structure from storage.');
                    }
                } else {
                    throw new Error('Receipt details not found in storage.');
                }
            } catch (error) {
                console.error("Failed to load receipt details:", error);
                logAuditEvent({
                    timestamp: new Date().toISOString(),
                    actionType: 'ERROR_OCCURRED',
                    entityId: receiptId || undefined,
                    metadata: { message: error instanceof Error ? error.message : String(error), action: 'fetchReceiptDetails' }
                });
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Could not load receipt details. It might have expired or been moved. Please try again or contact support.',
                });
                router.push('/'); // Redirect on error
            }
        };
        fetchReceiptDetails();
    }, [router, toast, searchParams]);

    const handlePrint = () => {
        window.print();
    };

    if (!receiptData) {
        return (
            // Added audit log for loading state if initial data is missing
            <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <h2 className="text-2xl font-semibold">Loading Receipt...</h2>
            </div>
        );
    }

    const { payment, billedItem, balanceAfterPayment } = receiptData;

    const isProperty = 'Property Name' in billedItem;
    const itemName = isProperty ? getPropertyValue(billedItem, 'Property Name') : getPropertyValue(billedItem, 'BUSINESS NAME & ADD');
    const ownerName = isProperty ? getPropertyValue(billedItem, 'Owner Name') : getPropertyValue(billedItem, 'NAME OF OWNER');
    const itemIdentifier = isProperty ? getPropertyValue(billedItem, 'Property No') : getPropertyValue(billedItem, 'BOP No'); // Assuming BOP also has a 'BOP No'

    const handlePrintAndAudit = () => {
        logAuditEvent({
            timestamp: new Date().toISOString(),
            actionType: 'RECEIPT_PRINTED',
            entityType: 'Payment',
            entityId: payment.id,
        });
        window.print();
    };

    return (
        <div className="max-w-2xl mx-auto py-8 print:py-0 print:max-w-full">
            <Card className="print:shadow-none print:border-0">
                <CardHeader className="text-center">
                    <CardTitle className="text-4xl font-bold mb-2">Payment Receipt</CardTitle>
                    <p className="text-lg text-muted-foreground">Thank you for your payment!</p>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                    <div className="grid grid-cols-2 gap-4 text-lg">
                        <div className="font-semibold">Receipt ID:</div>
                        <div>{payment.id}</div>

                        <div className="font-semibold">Date:</div>
                        <div>{new Date(payment.date).toLocaleString()}</div>

                        <div className="font-semibold">Amount Paid:</div>
                        <div className="font-bold text-primary">{formatCurrency(payment.amount)}</div>

                        <div className="font-semibold">Payment Method:</div>
                        <div>{payment.method}</div>
                    </div>

                    <hr className="my-4" />

                    <div className="grid grid-cols-2 gap-4 text-lg">
                        <div className="font-semibold">Billed To:</div>
                        <div>{ownerName || 'N/A'}</div>

                        <div className="font-semibold">{isProperty ? 'Property Name:' : 'Business Name:'}</div>
                        <div>{itemName || 'N/A'}</div>

                        <div className="font-semibold">{isProperty ? 'Property No:' : 'BOP No:'}</div>
                        <div>{itemIdentifier || 'N/A'}</div>
                    </div>

                    <hr className="my-4" />

                    <div className="flex justify-between items-center text-xl font-bold">
                        <span>New Balance:</span>
                        <span className="text-green-600">{formatCurrency(balanceAfterPayment)}</span>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4 pt-6 print:hidden">
                    <Button size="lg" onClick={handlePrintAndAudit} className="w-full">
                        <Printer className="mr-2 h-5 w-5" />
                        Print Receipt
                    </Button>
                    <Button variant="outline" onClick={() => router.push('/')} className="w-full">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Go to Dashboard
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}