'use client';

import React, { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { sendSms } from './sms-service';
import { Property, Bop, Bill } from './types';

interface SmsDeliveryProgressProps {
  items: (Property | Bop | Bill)[];
  template: string;
  onComplete: (results: { 
    itemId: string; 
    propertyId: string; 
    success: boolean; 
    error?: string; 
    timestamp: string 
  }[]) => void;
}

/**
 * A component that visualizes the progress of a bulk SMS sending operation.
 * It interfaces with the sendSms utility and reports completion results.
 */
export function SmsDeliveryProgress({ items, template, onComplete }: SmsDeliveryProgressProps) {
  const [processed, setProcessed] = useState(0);
  const total = items.length;

  useEffect(() => {
    let isMounted = true;

    const executeBatch = async () => {
      try {
        // The third argument is the onProgress callback defined in sms-service.ts
        const results = await sendSms(items, template, (currentProcessed) => {
          if (isMounted) setProcessed(currentProcessed);
        });
        
        if (isMounted) onComplete(results);
      } catch (error) {
        console.error("SMS batch dispatch failed:", error);
        if (isMounted) onComplete([]);
      }
    };

    executeBatch();

    return () => {
      isMounted = false;
    };
  }, [items, template, onComplete]);

  const percent = total > 0 ? Math.round((processed / total) * 100) : 0;

  return (
    <div className="space-y-4 py-6">
      <div className="flex justify-between text-sm font-medium">
        <span>Sending messages...</span>
        <span className="text-muted-foreground">{processed} / {total}</span>
      </div>
      <Progress value={percent} className="h-2" />
      <p className="text-xs text-center text-muted-foreground italic">
        Sending in progress. Please keep this dialog open.
      </p>
    </div>
  );
}