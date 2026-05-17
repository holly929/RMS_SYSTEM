'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react';
import { sendSms } from '@/lib/sms-service';
import type { Property, Bop } from '@/lib/types';

interface SmsDeliveryProgressProps {
  items: (Property | Bop)[];
  template: string;
  onComplete?: (results: any[]) => void;
}

export function SmsDeliveryProgress({ items, template, onComplete }: SmsDeliveryProgressProps) {
  const [status, setStatus] = useState<'sending' | 'completed' | 'error'>('sending');
  const [progress, setProgress] = useState(0);
  const [counts, setCounts] = useState({ sent: 0, failed: 0, total: items.length });
  const [allResults, setAllResults] = useState<{ propertyId: string; success: boolean; error?: string }[]>([]);

  const runSendingProcess = useCallback(async (targets: (Property | Bop)[]) => {
    setStatus('sending');
    setProgress(0);
    try {
      const results = await sendSms(targets, template, (processed, total) => {
        setProgress((processed / total) * 100);
      });

      setAllResults(prev => {
        const newMap = new Map(prev.map(r => [r.propertyId, r]));
        results.forEach(r => newMap.set(r.propertyId, r));
        const merged = Array.from(newMap.values());
        
        const sent = merged.filter(r => r.success).length;
        setCounts({
          sent,
          failed: items.length - sent,
          total: items.length
        });
        return merged;
      });

      setStatus('completed');
    } catch (err) {
      console.error("SMS batch error:", err);
      setStatus('error');
    }
  }, [items.length, template]);

  useEffect(() => {
    runSendingProcess(items);
  }, [items, runSendingProcess]);

  useEffect(() => {
    if (status === 'completed' && onComplete) {
      onComplete(allResults);
    }
  }, [status, allResults, onComplete]);

  const handleRetryFailed = () => {
    const failedIds = allResults.filter(r => !r.success).map(r => r.propertyId);
    const failedItems = items.filter(item => failedIds.includes(item.id));
    if (failedItems.length > 0) {
      runSendingProcess(failedItems);
    }
  };

  return (
    <div className="space-y-4 py-4">
      <div className="flex justify-between text-sm font-medium">
        <span className="flex items-center gap-2">
          {status === 'sending' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          {status === 'completed' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          {status === 'error' && <AlertCircle className="h-4 w-4 text-destructive" />}
          {status === 'sending' ? 'Sending Messages...' : 'Delivery Complete'}
        </span>
        <span>{Math.round(progress)}%</span>
      </div>
      
      <Progress value={progress} className="h-2" />

      <div className="grid grid-cols-2 gap-4 pt-2">
        <div className="rounded-md bg-green-50 p-3 text-center">
          <p className="text-xs font-bold text-green-600 uppercase">Success</p>
          <p className="text-xl font-bold text-green-700">{counts.sent}</p>
        </div>
        <div className="rounded-md bg-destructive/10 p-3 text-center">
          <p className="text-xs font-bold text-destructive uppercase">Failed</p>
          <p className="text-xl font-bold text-destructive">{counts.failed}</p>
        </div>
      </div>

      {status === 'completed' && counts.failed > 0 && (
        <div className="pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full flex items-center justify-center gap-2"
            onClick={handleRetryFailed}
          >
            <RotateCcw className="h-4 w-4" />
            Retry {counts.failed} Failed Messages
          </Button>
        </div>
      )}

      {status === 'error' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Batch Process Failed</AlertTitle>
          <AlertDescription>
            A critical error occurred while communicating with the SMS service.
          </AlertDescription>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2 w-full"
            onClick={() => runSendingProcess(items)}
          >
            <RotateCcw className="h-4 w-4 mr-2" /> Try Batch Again
          </Button>
        </Alert>
      )}
    </div>
  );
}