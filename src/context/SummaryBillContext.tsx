
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Bop, Property } from '@/lib/types';
import type { Bop as SummaryBillData } from '@/lib/types'; // Re-using Bop as it is a flexible key-value store
import { store, saveStore } from '@/lib/store';
import { useActivityLogDispatch } from './ActivityLogContext';
import { usePropertyData } from './PropertyDataContext';
import { useBopData } from './BopDataContext';
import { useToast } from '@/hooks/use-toast';

interface SummaryBillContextType {
    workbook: { [sheetName: string]: { data: SummaryBillData[], headers: string[] } };
    setWorkbook: (workbook: { [sheetName: string]: { data: SummaryBillData[], headers: string[] } }) => void;
    deleteAllSummaryBills: () => void;
    fetchDataFromProperties: () => void;
    fetchDataFromBop: () => void;
}

const SummaryBillContext = createContext<SummaryBillContextType | undefined>(undefined);

export function SummaryBillProvider({ children }: { children: React.ReactNode }) {
    const addLog = useActivityLogDispatch();
    const { toast } = useToast();
    const [workbook, setWorkbookState] = useState<{ [sheetName: string]: { data: SummaryBillData[], headers: string[] } }>(store.summaryBillWorkbook || {});
    
    // Get data from Property and BOP contexts
    const { properties, headers: propertyHeaders } = usePropertyData();
    const { bopData, headers: bopHeaders } = useBopData();
    
    const setAndPersistWorkbook = (newWorkbook: { [sheetName: string]: { data: SummaryBillData[], headers: string[] } }) => {
        store.summaryBillWorkbook = newWorkbook;
        setWorkbookState(newWorkbook);
        saveStore();
    };

    const deleteAllSummaryBills = () => {
        const count = Object.values(store.summaryBillWorkbook || {}).reduce((acc, sheet) => acc + sheet.data.length, 0);
        setAndPersistWorkbook({});
        if (count > 0) {
            addLog('Cleared Summary Bills', `${count} records deleted from all sheets`);
        }
    };

    const fetchDataFromProperties = () => {
        // Convert properties to summary bill format
        const convertedData = properties.map((property, index) => {
            const rowData: any = { id: `property-${property.id}` };
            propertyHeaders.forEach(header => {
                rowData[header] = property[header];
            });
            return rowData as SummaryBillData;
        });

        const newWorkbook = {
            ...workbook,
            'Properties': {
                data: convertedData,
                headers: propertyHeaders
            }
        };

        setAndPersistWorkbook(newWorkbook);
        addLog('Fetched Properties Data', `${convertedData.length} property records added to summary bill`);
        toast({
            title: 'Properties Data Fetched',
            description: `${convertedData.length} property records added to summary bill`,
        });
    };

    const fetchDataFromBop = () => {
        // Convert BOP data to summary bill format
        const convertedData = bopData.map((bop, index) => {
            const rowData: any = { id: `bop-${bop.id}` };
            bopHeaders.forEach(header => {
                rowData[header] = bop[header];
            });
            return rowData as SummaryBillData;
        });

        const newWorkbook = {
            ...workbook,
            'BOP Data': {
                data: convertedData,
                headers: bopHeaders
            }
        };

        setAndPersistWorkbook(newWorkbook);
        addLog('Fetched BOP Data', `${convertedData.length} BOP records added to summary bill`);
        toast({
            title: 'BOP Data Fetched',
            description: `${convertedData.length} BOP records added to summary bill`,
        });
    };

    return (
        <SummaryBillContext.Provider value={{ 
            workbook, 
            setWorkbook: setAndPersistWorkbook, 
            deleteAllSummaryBills,
            fetchDataFromProperties,
            fetchDataFromBop
        }}>
            {children}
        </SummaryBillContext.Provider>
    );
}

export function useSummaryBillData() {
    const context = useContext(SummaryBillContext);
    if (context === undefined) {
        throw new Error('useSummaryBillData must be used within a SummaryBillProvider');
    }
    return context;
}
