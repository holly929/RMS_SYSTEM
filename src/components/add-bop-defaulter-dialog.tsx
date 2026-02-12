'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import type { Bop } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { getPropertyValue } from '@/lib/property-utils';

interface AddBopDefaulterDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onBopAdd: (bop: Omit<Bop, 'id'>) => void;
  existingBops: Bop[];
}

const bopFormSchema = z.object({
  'BOP No': z.string().min(1, 'BOP No. is required.'),
  'NAME OF AREA COUNCIL': z.string().min(3, 'Name of area council is required.'),
  'NAME OF COMMUNITY': z.string().min(3, 'Name of community is required.'),
  'BUSINESS NAME & ADD': z.string().min(3, 'Business name is required.'),
  'NAME OF OWNER': z.string().min(3, 'Name of owner is required.'),
  'SEX OF OWNER': z.string().min(1, 'Sex of owner is required.'),
  'BUSINESS CATEGORY': z.string().min(3, 'Business category is required.'),
  'DESCRIPTION OF BUSINESS': z.string().min(3, 'Description of business is required.'),
  'AMOUNT': z.coerce.number().min(0, 'Amount must be a positive number.'),
  'Phone Number': z.string().min(10, 'Phone number must be at least 10 digits.'),
  'Payment': z.coerce.number().min(0, 'Payment must be a positive number.'),
});

export function AddBopDefaulterDialog({
  isOpen,
  onOpenChange,
  onBopAdd,
  existingBops,
}: AddBopDefaulterDialogProps) {
  
  // Auto-generate next serial number
  const getNextSerialNumber = () => {
    const year = new Date().getFullYear();
    const currentYearBops = existingBops.filter(bop => {
      const no = bop['BOP No'];
      return typeof no === 'string' && no.startsWith(`BOP/${year}/`);
    });

    if (currentYearBops.length === 0) return `BOP/${year}/001`;

    const serialNumbers = currentYearBops.map(bop => {
      const match = bop['BOP No'].match(/BOP\/\d+\/(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });

    const maxSerial = Math.max(...serialNumbers, 0);
    return `BOP/${year}/${String(maxSerial + 1).padStart(3, '0')}`;
  };

  const form = useForm<z.infer<typeof bopFormSchema>>({
    resolver: zodResolver(bopFormSchema),
    defaultValues: {
      'BOP No': getNextSerialNumber(),
      'NAME OF AREA COUNCIL': '',
      'NAME OF COMMUNITY': '',
      'BUSINESS NAME & ADD': '',
      'NAME OF OWNER': '',
      'SEX OF OWNER': '',
      'BUSINESS CATEGORY': '',
      'DESCRIPTION OF BUSINESS': '',
      'AMOUNT': 0,
      'Phone Number': '',
      'Payment': 0,
    }
  });

  function onSubmit(data: z.infer<typeof bopFormSchema>) {
    onBopAdd(data);
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New BOP Defaulter</DialogTitle>
          <DialogDescription>
            Add a new BOP defaulter record. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField control={form.control} name="BOP No" render={({ field }) => (
                         <FormItem>
                           <FormLabel>BOP No.</FormLabel>
                           <FormControl><Input readOnly {...field} value={field.value ?? ''} /></FormControl>
                           <FormMessage />
                         </FormItem>
                       )}
                     />
                    <FormField control={form.control} name="NAME OF AREA COUNCIL" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name of Area Council</FormLabel>
                          <FormControl><Input placeholder="e.g. Adom Trading" {...field} value={field.value ?? ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="NAME OF COMMUNITY" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name of Community</FormLabel>
                          <FormControl><Input placeholder="e.g. Adom Trading" {...field} value={field.value ?? ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={form.control} name="BUSINESS NAME & ADD" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Name & Address</FormLabel>
                          <FormControl><Input placeholder="e.g. Yaw Mensah" {...field} value={field.value ?? ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="NAME OF OWNER" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name of Owner</FormLabel>
                          <FormControl><Input placeholder="e.g. Abetifi" {...field} value={field.value ?? ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="SEX OF OWNER" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sex of Owner</FormLabel>
                          <FormControl>
                            <select {...field} className="w-full p-2 border rounded">
                                <option value="">Select...</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={form.control} name="BUSINESS CATEGORY" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Category</FormLabel>
                          <FormControl><Input placeholder="e.g. Abetifi" {...field} value={field.value ?? ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="DESCRIPTION OF BUSINESS" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description of Business</FormLabel>
                          <FormControl><Input placeholder="e.g. Abetifi" {...field} value={field.value ?? ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={form.control} name="AMOUNT" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl><Input type="number" step="10" {...field} value={field.value ?? ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="Phone Number" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl><Input type="tel" placeholder="e.g. 0244123456" {...field} value={field.value ?? ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={form.control} name="Payment" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment</FormLabel>
                          <FormControl><Input type="number" step="10" {...field} value={field.value ?? ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              <DialogFooter className="pt-6">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit">Add BOP Defaulter</Button>
              </DialogFooter>
            </form>
          </Form>
      </DialogContent>
    </Dialog>
  );
}
