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
import { calculateBalance } from '@/lib/billing-utils';
import { cn } from '@/lib/utils';

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