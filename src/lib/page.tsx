'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import type { Payment, Property, Bop } from '@/lib/types';
import { getPropertyValue } from '@/lib/property-utils';
import { logAuditEvent } from '@/lib/audit-service';
import { store } from '@/lib/store';

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
    const itemIdentifier = isProperty ? getPropertyValue(billedItem, 'Property No') : (getPropertyValue(billedItem, 'BOP No') || getPropertyValue(billedItem, 'BOP NO'));

    const appearance = store.settings.appearanceSettings || {};
    const general = store.settings.generalSettings || {};
    const billDisplay = store.settings.billDisplaySettings || {};

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
                <CardHeader className="text-center space-y-4">
                    <div className="flex justify-between items-center px-4">
                        {appearance.ghanaLogo && (
                            <Image src={appearance.ghanaLogo} alt="Ghana Coat of Arms" width={80} height={80} className="object-contain" />
                        )}
                        <div className="flex-1 text-center">
                            <h1 className="text-2xl font-bold tracking-tight uppercase">
                                {general.assemblyName || 'DISTRICT ASSEMBLY'}
                            </h1>
                            <p className="text-sm text-muted-foreground">{general.postalAddress}</p>
                            <p className="text-sm text-muted-foreground">TEL: {general.contactPhone}</p>
                        </div>
                        {appearance.assemblyLogo && (
                            <Image src={appearance.assemblyLogo} alt="Assembly Logo" width={80} height={80} className="object-contain" />
                        )}
                    </div>
                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-muted-foreground/30"></div>
                        </div>
                        <div className="relative flex justify-center text-sm uppercase">
                            <span className="bg-card px-2 text-muted-foreground">Official Payment Receipt</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-center">
                        <CheckCircle2 className="h-12 w-12 text-green-500 mb-2 print:hidden" />
                        <CardTitle className="text-3xl font-extrabold tracking-tight">Receipt #{payment.id.split('-').pop()?.toUpperCase()}</CardTitle>
                        <p className="text-muted-foreground">Generated on {new Date(payment.date).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-base">
                        <div className="space-y-4">
                            <div className="flex flex-col border-b pb-2">
                                <span className="text-xs text-muted-foreground uppercase font-semibold">Payment Details</span>
                                <div className="flex justify-between mt-1">
                                    <span>Amount Paid:</span>
                                    <span className="font-bold text-primary">{formatCurrency(payment.amount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Method:</span>
                                    <span className="capitalize">{payment.method}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Time:</span>
                                    <span>{new Date(payment.date).toLocaleTimeString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex flex-col border-b pb-2">
                                <span className="text-xs text-muted-foreground uppercase font-semibold">Customer Information</span>
                                <div className="flex flex-col mt-1">
                                    <span className="font-medium">{ownerName || 'Valued Customer'}</span>
                                    <span className="text-sm text-muted-foreground">{itemName || 'N/A'}</span>
                                    <span className="text-sm text-muted-foreground">{itemIdentifier}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-muted/30 p-4 rounded-lg border border-dashed flex justify-between items-center text-xl font-bold">
                        <span>Outstanding Balance:</span>
                        <span className={balanceAfterPayment > 0 ? "text-destructive" : "text-green-600"}>
                            {formatCurrency(balanceAfterPayment)}
                        </span>
                    </div>

                    {/* Professional Signature & Stamp Section */}
                    <div className="grid grid-cols-2 gap-4 pt-12">
                        <div className="text-center flex flex-col items-center">
                             <div className="h-16 w-32 border-b-2 border-black/20 flex items-center justify-center italic text-muted-foreground text-xs relative">
                                {appearance.signature ? (
                                    <Image src={appearance.signature} alt="Signature" width={120} height={50} className="object-contain" />
                                ) : (
                                    <span className="opacity-10">Cashier Signature</span>
                                )}
                             </div>
                             <span className="text-[10px] uppercase font-bold mt-1">Authorized Cashier</span>
                        </div>
                        <div className="text-center flex flex-col items-center">
                             <div className="h-16 w-32 border-2 border-dashed border-primary/20 rounded-full flex items-center justify-center text-[8px] text-primary/20 uppercase font-black rotate-[-15deg]">
                                {appearance.assemblyLogo ? (
                                    <div className="flex flex-col items-center opacity-30">
                                        <Image src={appearance.assemblyLogo} alt="Stamp Logo" width={30} height={30} className="grayscale" />
                                        <span>Official Stamp</span>
                                    </div>
                                ) : (
                                    "Official Receipt Stamp"
                                )}
                             </div>
                             <span className="text-[10px] uppercase font-bold mt-1">Director's Endorsement</span>
                        </div>
                    </div>
                    
                    <p className="text-[9px] text-center text-muted-foreground mt-8 italic">
                        {billDisplay.billWarningText || `Thank you for your prompt payment. This receipt is computer generated and serves as official proof of payment to the ${general.assemblyName}.`}
                    </p>
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