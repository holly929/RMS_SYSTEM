'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useReactToPrint } from 'react-to-print';
import Link from 'next/link';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';

import type { Property, Bill } from '@/lib/types';
import { DemandNotice } from '@/components/demand-notice';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useBillData } from '@/context/BillDataContext';
import { useToast } from '@/hooks/use-toast';
import { getPropertyValue } from '@/lib/property-utils';
import { store } from '@/lib/store';

type GeneralSettings = {
  assemblyName?: string;
  postalAddress?: string;
  contactPhone?: string;
  email?: string;
  gps?: string;
  poBox?: string;
  region?: string;
};

type AppearanceSettings = {
  assemblyLogo?: string;
  ghanaLogo?: string;
  signature?: string;
  fontFamily?: 'sans' | 'serif' | 'mono';
  fontSize?: number;
};

const DemandNoticeSheet = React.forwardRef<HTMLDivElement, { properties: Property[], settings: { general: GeneralSettings, appearance: AppearanceSettings } }>(({ properties, settings }, ref) => {
    return (
        <div ref={ref}>
            <div className="print:space-y-0">
                {properties.length > 0 ? (
                    properties.map((property) => (
                        <div key={property.id} className="print-page-break w-[210mm] h-[297mm] mx-auto bg-white flex items-center justify-center">
                            <div className="w-full h-full scale-[0.95] flex items-center justify-center">
                                <DemandNotice data={property} billType="property" settings={settings} />
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center">
                        <h2 className="text-2xl font-semibold">No Properties to Print</h2>
                        <p className="text-muted-foreground mt-2">
                            It seems no properties were selected. Please go back to the Billing page and select some properties to print.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
});
DemandNoticeSheet.displayName = 'DemandNoticeSheet';


export default function PropertyDemandNoticePrintPage() {
  const router = useRouter();
  const componentRef = useRef<HTMLDivElement>(null);
  const { addBills } = useBillData();
  const { toast } = useToast();
  
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [renderedProperties, setRenderedProperties] = useState<Property[]>([]);
  const [settings, setSettings] = useState<{general: GeneralSettings, appearance: AppearanceSettings}>({ general: {}, appearance: {} });
  const [isClient, setIsClient] = useState(false);

  const [isPreparing, setIsPreparing] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setIsClient(true);
    const loadData = () => {
        try {
            const storedProperties = localStorage.getItem('selectedPropertiesForDemandNotice');
            if (storedProperties) {
                setAllProperties(JSON.parse(storedProperties));
            }
            setSettings({
                general: store.settings.generalSettings || {},
                appearance: store.settings.appearanceSettings || {},
            });
        } catch (error) {
            console.error("Could not load data", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load data for printing.' });
        }
    }
    loadData();
  }, []);

  const recordBills = async () => {
    if (renderedProperties.length === 0) return;

    const newBills: Omit<Bill, 'id'>[] = renderedProperties.map(p => {
        const rateableValue = Number(getPropertyValue(p, 'Rateable Value')) || 0;
        const rateImpost = Number(getPropertyValue(p, 'Rate Impost')) || 0;
        const sanitationCharged = Number(getPropertyValue(p, 'Sanitation Charged')) || 0;
        const previousBalance = Number(getPropertyValue(p, 'Previous Balance')) || 0;
        const totalPayment = Number(getPropertyValue(p, 'Total Payment')) || 0;

        const amountCharged = rateableValue * rateImpost;
        const totalThisYear = amountCharged + sanitationCharged;
        const totalAmountDue = totalThisYear + previousBalance - totalPayment;

        return {
            propertyId: p.id,
            propertySnapshot: p,
            generatedAt: new Date().toISOString(),
            year: new Date().getFullYear(),
            totalAmountDue: totalAmountDue,
            billType: 'property',
        };
    });
    
    const success = await addBills(newBills);
    if (success) {
      toast({
          title: 'Bills Recorded',
          description: `${newBills.length} demand notices have been recorded in the bill history.`,
      });
    }
  };

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    pageStyle: `@media print { 
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .print-page-break { page-break-after: always; } 
        .no-print { display: none; } 
    }`,
    onAfterPrint: () => recordBills(),
  });

  const handleGenerateAndPrint = () => {
    if (renderedProperties.length === 0) {
        toast({
            variant: 'destructive',
            title: 'No Demand Notices Ready',
            description: 'There are no demand notices prepared for printing.',
        });
        return;
    };
    handlePrint();
  };

  useEffect(() => {
    if (allProperties.length > 0 && isClient) {
        setIsPreparing(true);
        setRenderedProperties([]);
        setProgress(0);
        
        const propertiesToRender = [...allProperties];
        let currentIndex = 0;
        const chunkSize = 20;

        const renderChunk = () => {
            if (currentIndex >= propertiesToRender.length) {
                setIsPreparing(false);
                return;
            }

            const nextIndex = Math.min(currentIndex + chunkSize, propertiesToRender.length);
            const chunk = propertiesToRender.slice(currentIndex, nextIndex);
            setRenderedProperties(prev => [...prev, ...chunk]);
            setProgress(nextIndex);
            currentIndex = nextIndex;

            setTimeout(renderChunk, 10);
        };
        
        renderChunk();
    }
  }, [allProperties, isClient]);

  if (!isClient) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isPreparing) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <header className="no-print bg-card border-b p-4 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-xl font-semibold">Preparing Demand Notices...</h1>
        </header>
        <main className="flex-grow flex flex-col items-center justify-center text-center p-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h2 className="text-2xl font-semibold">Please Wait</h2>
          <p className="text-muted-foreground mt-2 max-w-md">
            We are preparing {allProperties.length} demand notices for printing. This may take a moment.
          </p>
          <div className="w-full max-w-md mt-6">
            <Progress value={allProperties.length > 0 ? (progress / allProperties.length) * 100 : 0} />
            <p className="text-sm text-muted-foreground mt-2">
              {progress} / {allProperties.length} demand notices ready
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="no-print bg-card border-b p-4 flex flex-col sm:flex-row items-center justify-between sticky top-0 z-10 gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
            <Button asChild variant="outline" size="sm">
                <Link href="/billing">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Link>
            </Button>
            <h1 className="text-lg sm:text-xl font-semibold">
                Demand Notice Preview ({allProperties.length} {allProperties.length === 1 ? 'Notice' : 'Notices'})
            </h1>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Button onClick={handleGenerateAndPrint} disabled={renderedProperties.length === 0} className="w-full sm:w-auto">
              <Printer className="mr-2 h-4 w-4" />
              Print & Record Demand Notices
            </Button>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-4 print:hidden">
         <div className="text-center">
            <h2 className="text-2xl font-semibold">Ready to Print</h2>
            <p className="text-muted-foreground mt-2">
                Clicking the print button will open the print dialog and record the demand notices in your history.
            </p>
            <p className="text-muted-foreground mt-1">Click the "Print & Record Demand Notices" button above to continue.</p>
         </div>
      </main>
      
      <div className="invisible h-0 overflow-hidden print:visible print:h-auto print:overflow-visible">
        <DemandNoticeSheet ref={componentRef} properties={renderedProperties} settings={settings} />
      </div>
    </div>
  );
}
