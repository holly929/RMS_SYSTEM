// c:\Users\ANEH MATHEW\RMS_SYSTEM\src\app\receipt\page.tsx
'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, Loader2, CheckCircle2, MapPin, Phone } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import type { Payment, Property, Bop } from '@/lib/types';
import { getPropertyValue } from '@/lib/property-utils';
import { store } from '@/lib/store';

const formatCurrency = (value: number) => 
    `GHS ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function ReceiptContent() {
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
            if (!receiptId) return;

            try {
                const stored = localStorage.getItem('receiptDetails');
                if (stored) {
                    const data = JSON.parse(stored);
                    if (data.payment.id === receiptId) {
                        setReceiptData(data);
                    }
                }
            } catch (error) {
                console.error("Error loading receipt", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to load receipt details.' });
            }
        };
        fetchReceiptDetails();
    }, [searchParams, toast]);

    if (!receiptData) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading receipt details...</p>
            </div>
        );
    }

    const { payment, billedItem, balanceAfterPayment } = receiptData;
    const general = store.settings.generalSettings || {};
    const appearance = store.settings.appearanceSettings || {};
    const isProperty = 'Property Name' in billedItem;
    const identifier = isProperty ? getPropertyValue(billedItem, 'Property No') : getPropertyValue(billedItem, 'BOP No');
    const owner = isProperty ? getPropertyValue(billedItem, 'Owner Name') : getPropertyValue(billedItem, 'NAME OF OWNER');

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 print:bg-white print:p-0">
            <div className="mx-auto max-w-2xl">
                <div className="mb-6 flex items-center justify-between no-print">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Button onClick={() => window.print()} className="bg-primary">
                        <Printer className="mr-2 h-4 w-4" /> Print Receipt
                    </Button>
                </div>

                <Card className="border-none shadow-lg print:shadow-none">
                    <CardHeader className="border-b bg-primary/5 text-center">
                        <div className="flex justify-center mb-4">
                            {appearance.ghanaLogo && (
                                <Image src={appearance.ghanaLogo} alt="Logo" width={60} height={60} />
                            )}
                        </div>
                        <CardTitle className="text-xl font-bold uppercase">{general.assemblyName}</CardTitle>
                        <CardDescription className="flex flex-col items-center gap-1">
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {general.postalAddress}</span>
                            <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {general.contactPhone}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-8">
                        <div className="flex flex-col items-center text-center">
                            <CheckCircle2 className="mb-2 h-12 w-12 text-green-500" />
                            <h2 className="text-2xl font-bold">Official Payment Receipt</h2>
                            <p className="text-sm text-muted-foreground">Receipt ID: {payment.id}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-y-4 rounded-lg border p-4 text-sm">
                            <div className="text-muted-foreground">Date:</div>
                            <div className="font-medium text-right">{new Date(payment.date).toLocaleString()}</div>
                            <div className="text-muted-foreground">Payer Name:</div>
                            <div className="font-medium text-right">{owner}</div>
                            <div className="text-muted-foreground">Reference:</div>
                            <div className="font-medium text-right font-mono">{identifier}</div>
                            <div className="text-muted-foreground">Payment Method:</div>
                            <div className="font-medium text-right capitalize">{payment.method.replace('_', ' ')}</div>
                        </div>

                        <div className="space-y-2 border-t pt-4">
                            <div className="flex justify-between items-center text-lg">
                                <span className="font-semibold">Amount Paid:</span>
                                <span className="font-bold text-primary">{formatCurrency(payment.amount)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-muted-foreground">
                                <span>Outstanding Balance:</span>
                                <span>{formatCurrency(balanceAfterPayment)}</span>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col border-t bg-slate-50/50 p-8 text-center print:bg-transparent">
                        <div className="mb-4 h-16 w-full relative flex justify-center items-center">
                           {appearance.signature && (
                               <Image src={appearance.signature} alt="Signature" width={120} height={50} style={{ objectFit: 'contain' }} />
                           )}
                        </div>
                        <p className="font-bold uppercase underline">Finance Officer</p>
                        <p className="mt-4 text-[10px] text-muted-foreground italic">
                            This is a computer-generated receipt. No signature is required. Thank you for your contribution to development.
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

export default function ReceiptPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        }>
            <ReceiptContent />
        </Suspense>
    );
}