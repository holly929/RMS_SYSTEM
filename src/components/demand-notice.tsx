'use client';

import React, { useMemo, useCallback } from 'react';
import type { Property, Bop } from '@/lib/types';
import { cn } from '@/lib/utils';
import Image from 'next/image';

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

interface DemandNoticeProps {
  data: Property | Bop;
  billType: 'property' | 'bop';
  settings: { general?: GeneralSettings; appearance?: AppearanceSettings };
}

export const DemandNotice = React.forwardRef<HTMLDivElement, DemandNoticeProps>(
  ({ data, billType, settings }, ref) => {
    const { 
      fontFamily, 
      fontSize 
    } = settings.appearance || {};

    const fontClass = useMemo(() => ({
        sans: 'font-sans',
        serif: 'font-serif',
        mono: 'font-mono'
    }[fontFamily || 'sans']), [fontFamily]);

    const baseStyle = useMemo(() => ({
        fontSize: `${fontSize || 12}px`,
        lineHeight: `${(fontSize || 12) * 1.5}px`,
    }), [fontSize]);

    const formatAmount = useCallback((amount: number | null) => (amount != null ? amount.toFixed(2) : '0.00'), []);
    
    const formatValue = useCallback((valueKey: string) => {
        if (!data) return '...';
        const val = data[valueKey];
        return val != null && val !== '' ? String(val) : '...';
    }, [data]);

    const getNumber = (key: string): number | null => {
        if (!data) return null;
        const value = data[key];
        if (value === null || value === undefined || String(value).trim() === '') return null;
        const cleanedValue = String(value).replace(/[^0-9.-]/g, '');
        if (cleanedValue === '') return null;
        const num = Number(cleanedValue);
        return isNaN(num) ? null : num;
    };

    const currentYear = new Date().getFullYear();
    const currentDate = new Date().toLocaleDateString('en-GH', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });

     const renderPropertyDemandNotice = () => {
      const totalAmountDue = getNumber('Amount') || 0;

      const propertyAddress = formatValue('Suburb') || formatValue('Town') || '';
      
      return (
        <div ref={ref} className={cn("text-black bg-white w-full h-full box-border p-8", fontClass)} style={baseStyle}>
          <div className="h-full flex flex-col">
            <header className="mb-8">
              <div className="flex justify-between items-start text-center">
                {settings.appearance?.ghanaLogo && (
                  <Image src={settings.appearance.ghanaLogo} alt="Ghana Coat of Arms" className="object-contain" width={80} height={80} />
                )}
                <div className="flex-1 mx-4">
                  <h1 className="font-bold tracking-wide text-2xl">{settings.general?.assemblyName?.toUpperCase() || 'DISTRICT ASSEMBLY'}</h1>
                  <p className="text-sm">{settings.general?.postalAddress}</p>
                  <p className="text-sm">TEL: {settings.general?.contactPhone}</p>
                  <p className="text-sm">EMAIL: {settings.general?.email || 'info@districtassembly.gov.gh'}</p>
                  <p className="text-sm">GPS: {settings.general?.gps || 'NA'}</p>
                </div>
                {settings.appearance?.assemblyLogo && (
                  <Image src={settings.appearance.assemblyLogo} alt="Assembly Logo" className="object-contain" width={80} height={80} />
                )}
              </div>
            </header>

            <main className="flex-grow space-y-6">
              <div className="flex justify-between">
                <div>
                  <p className="font-bold">My Ref: CA/314/340/02</p>
                  <p>Your Ref: _____________</p>
                </div>
                <div className="text-right">
                  <p>P.O. Box {settings.general?.poBox || '30'}</p>
                  <p>{settings.general?.postalAddress?.split(',')[0] || 'Kpandai'}</p>
                  <p>{settings.general?.region || 'Northern Region'}, Ghana</p>
                </div>
              </div>

              <div className="text-right">
                <p>{currentDate}</p>
              </div>

              <h2 className="font-bold text-xl underline mt-8">DEMAND NOTICE</h2>
              <h3 className="font-bold text-lg">PROPERTY RATE - {currentYear}</h3>

              <div className="space-y-4 text-justify">
                <p>
                  1. The {settings.general?.assemblyName || 'Kpandai District Assembly'} is vested with the power under the Local Governance Act, 936 of 2016 to levy fees and rates in {settings.general?.postalAddress?.split(',')[0] || 'Kpandai'} and its environs.
                </p>
                
                <p>
                  2. Under Section 146 (sub-section (6) of the Local Governance Act 936, every Public Board, Statutory Corporation, Limited Liability Company or Subvention Organization shall unless exempted under Section 149 of this Act or any other enactment be liable to pay property rates and Business Operating Permit fee.
                </p>

                <p>
                  3. In line with this legal provision, a Property Rate of GH¢{formatAmount(totalAmountDue)} is levied on your {formatValue('Type of Property') || 'Property'} situated at {propertyAddress} within the {settings.general?.assemblyName || 'Kpandai District'} for the fiscal year {currentYear}.
                </p>

                <p>
                  4. You are required to settle this amount early enough to enable the Assembly meet its budgetary requirements.
                </p>
              </div>

              <div className="mt-12 flex justify-end">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-20">
                      {settings.appearance?.signature && (
                          <Image src={settings.appearance.signature} alt="Signature" className="max-h-full max-w-full object-contain" width={150} height={60} data-ai-hint="signature" />
                      )}
                  </div>
                  <p className="border-t-2 border-black max-w-[15rem] mx-auto mt-1 pt-1 font-bold">
                      DISTRICT CO-ORDINATING DIRECTOR
                  </p>
                  <p className="text-sm">FOR: DISTRICT CHIEF EXECUTIVE</p>
                </div>
              </div>

              <div className="mt-8">
                <p className="font-bold">THE OWNER</p>
                <p>{formatValue('Owner Name') || 'Property Owner'}</p>
                {data['Property Name'] && <p>{formatValue('Property Name')}</p>}
                <p>{propertyAddress}</p>
              </div>
            </main>
          </div>
        </div>
      );
    };

    const renderBopDemandNotice = () => {
      const totalAmountDue = getNumber('AMOUNT') || 0;
      
      const businessAddress = formatValue('BUSINESS LOCATION') || formatValue('NAME OF COMMUNITY') || '';
      
      return (
        <div ref={ref} className={cn("text-black bg-white w-full h-full box-border p-8", fontClass)} style={baseStyle}>
          <div className="h-full flex flex-col">
            <header className="mb-8">
              <div className="flex justify-between items-start text-center">
                {settings.appearance?.ghanaLogo && (
                  <Image src={settings.appearance.ghanaLogo} alt="Ghana Coat of Arms" className="object-contain" width={80} height={80} />
                )}
                <div className="flex-1 mx-4">
                  <h1 className="font-bold tracking-wide text-2xl">{settings.general?.assemblyName?.toUpperCase() || 'DISTRICT ASSEMBLY'}</h1>
                  <p className="text-sm">{settings.general?.postalAddress}</p>
                  <p className="text-sm">TEL: {settings.general?.contactPhone}</p>
                  <p className="text-sm">EMAIL: {settings.general?.email || 'info@districtassembly.gov.gh'}</p>
                  <p className="text-sm">GPS: {settings.general?.gps || 'NA'}</p>
                </div>
                {settings.appearance?.assemblyLogo && (
                  <Image src={settings.appearance.assemblyLogo} alt="Assembly Logo" className="object-contain" width={80} height={80} />
                )}
              </div>
            </header>

            <main className="flex-grow space-y-6">
              <div className="flex justify-between">
                <div>
                  <p className="font-bold">My Ref: CA/314/340/02</p>
                  <p>Your Ref: _____________</p>
                </div>
                <div className="text-right">
                  <p>P.O. Box {settings.general?.poBox || '30'}</p>
                  <p>{settings.general?.postalAddress?.split(',')[0] || 'Kpandai'}</p>
                  <p>{settings.general?.region || 'Northern Region'}, Ghana</p>
                </div>
              </div>

              <div className="text-right">
                <p>{currentDate}</p>
              </div>

              <h2 className="font-bold text-xl underline mt-8">DEMAND NOTICE</h2>
              <h3 className="font-bold text-lg">BUSINESS OPERATING PERMIT – {currentYear}</h3>

              <div className="space-y-4 text-justify">
                <p>
                  1. The {settings.general?.assemblyName || 'Kpandai District Assembly'} is vested with the power under the Local Governance Act, 936 of 2016 to levy fees and rates in {settings.general?.postalAddress?.split(',')[0] || 'Kpandai'} and its environs.
                </p>
                
                <p>
                  2. Under Section 146 (sub-section (6) of the Local Governance Act 936, every Public Board, Statutory Corporation, Limited Liability Company or Subvention Organization shall unless exempted under Section 149 of this Act or any other enactment be liable to pay property rates and Business Operating Permit fee.
                </p>

                <p>
                  3. In line with this legal provision, a Business Operating Permit of GH¢{formatAmount(totalAmountDue)} is levied on your {formatValue('DESCRIPTION OF BUSINESS') || 'Business'} situated at {businessAddress} within the {settings.general?.assemblyName || 'Kpandai District'} for the fiscal year {currentYear}.
                </p>

                <p>
                  4. You are required to settle this amount early enough to enable the Assembly meet its budgetary requirements.
                </p>
              </div>

              <div className="mt-12 flex justify-end">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-20">
                      {settings.appearance?.signature && (
                          <Image src={settings.appearance.signature} alt="Signature" className="max-h-full max-w-full object-contain" width={150} height={60} data-ai-hint="signature" />
                      )}
                  </div>
                  <p className="border-t-2 border-black max-w-[15rem] mx-auto mt-1 pt-1 font-bold">
                      DISTRICT CO-ORDINATING DIRECTOR
                  </p>
                  <p className="text-sm">FOR: DISTRICT CHIEF EXECUTIVE</p>
                </div>
              </div>

              <div className="mt-8">
                <p className="font-bold">THE MANAGER</p>
                <p>{formatValue('BUSINESS NAME & ADD') || 'Business Name'}</p>
                <p>{formatValue('NAME OF OWNER')}</p>
                <p>{businessAddress}</p>
              </div>
            </main>
          </div>
        </div>
      );
    };

    return billType === 'property' ? renderPropertyDemandNotice() : renderBopDemandNotice();
  }
);

DemandNotice.displayName = 'DemandNotice';
