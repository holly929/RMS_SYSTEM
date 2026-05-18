'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Loader2, Printer } from 'lucide-react';

import { DemandNotice } from '@/components/demand-notice';
import { store } from '@/lib/store';
import type { Property, Bop, FullSettings } from '@/lib/types';
import { Button } from '@/components/ui/button';

export default function PrintPreviewPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<FullSettings>({});
  const [dataToPrint, setDataToPrint] = useState<Property | Bop | null>(null);
  const [billType, setBillType] = useState<'property' | 'bop' | null>(null);
  const componentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = () => {
      setIsLoading(true);
      try {
        // Load settings from the store
        setSettings({
          general: store.settings.generalSettings || {},
          appearance: store.settings.appearanceSettings || {},
          billDisplay: store.settings.billDisplaySettings || {},
        });

        // Load data to print from localStorage
        const storedData = localStorage.getItem('demandNoticeDataForPrinting');
        const storedBillType = localStorage.getItem('demandNoticeBillTypeForPrinting');

        if (storedData && storedBillType) {
          setDataToPrint(JSON.parse(storedData));
          setBillType(storedBillType as 'property' | 'bop');
        } else {
          console.error("No demand notice data found in localStorage for printing.");
        }
      } catch (error) {
        console.error("Error loading data for print preview:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Demand_Notice_${billType}_${dataToPrint ? (dataToPrint as any)['Property No'] || (dataToPrint as any)['BOP No'] : 'Unknown'}`,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Loading print preview...</p>
      </div>
    );
  }

  if (!dataToPrint || !billType) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-red-500">
        <p className="text-lg">Error: Could not load demand notice data for printing.</p>
        <p className="text-sm">Please ensure you selected an item to print from the previous page.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4 bg-gray-100 min-h-screen">
      <div className="w-full max-w-4xl bg-white shadow-lg p-6 mb-4 flex justify-end no-print">
        <Button onClick={handlePrint} disabled={isLoading}>
          <Printer className="mr-2 h-4 w-4" />
          Print Demand Notice
        </Button>
      </div>
      <div className="w-[210mm] min-h-[297mm] bg-white shadow-lg"> {/* A4 size */}
        <DemandNotice
          ref={componentRef}
          data={dataToPrint as Property | Bop}
          billType={billType as 'property' | 'bop'}
          settings={settings}
        />
      </div>
    </div>
  );
}