'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import type { Property } from '@/lib/types';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getPropertyValue } from '@/lib/property-utils';

interface AddPropertyDefaulterDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onPropertyAdd: (property: Omit<Property, 'id'>) => void;
  existingProperties: Property[];
}

const propertyFormSchema = z.object({
  'Property No': z.string().min(1, 'Property No. is required.'),
  'Property Name': z.string().min(3, 'Property Name is required.'),
  'Owner Name': z.string().min(3, 'Owner Name is required.'),
  'Phone Number': z.string().min(10, 'Phone Number must be at least 10 digits.'),
  'Type of Property': z.enum(['Residential', 'Commercial', 'Industrial', 'Agricultural', 'Mixed']),
  'Suburb': z.string().min(2, 'Suburb is required.'),
  'Amount': z.coerce.number().min(0, 'Amount must be a positive number.'),
  'Rateable Value': z.coerce.number().min(0, 'Rateable Value must be a positive number.'),
  'Rate Impost': z.coerce.number().min(0, 'Rate Impost must be a positive number.'),
  'Sanitation Charged': z.coerce.number().min(0, 'Sanitation Charged must be a positive number.'),
  'Previous Balance': z.coerce.number().min(0, 'Previous Balance must be a positive number.'),
  'Total Payment': z.coerce.number().min(0, 'Total Payment must be a positive number.'),
  created_at: z.date().optional(),
});

export function AddPropertyDefaulterDialog({
  isOpen,
  onOpenChange,
  onPropertyAdd,
  existingProperties,
}: AddPropertyDefaulterDialogProps) {
  
  // Auto-generate next serial number
  const getNextSerialNumber = () => {
    const year = new Date().getFullYear();
    const currentYearProperties = existingProperties.filter(prop => {
      const no = prop['Property No'];
      return typeof no === 'string' && no.startsWith(`PROP/${year}/`);
    });

    if (currentYearProperties.length === 0) return `PROP/${year}/001`;

    const serialNumbers = currentYearProperties.map(prop => {
      const match = prop['Property No'].match(/PROP\/\d+\/(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });

    const maxSerial = Math.max(...serialNumbers, 0);
    return `PROP/${year}/${String(maxSerial + 1).padStart(3, '0')}`;
  };

  const form = useForm<z.infer<typeof propertyFormSchema>>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      'Property No': getNextSerialNumber(),
      'Property Name': '',
      'Owner Name': '',
      'Phone Number': '',
      'Type of Property': 'Residential',
      'Suburb': '',
      'Amount': 0,
      'Rateable Value': 0,
      'Rate Impost': 0,
      'Sanitation Charged': 0,
      'Previous Balance': 0,
      'Total Payment': 0,
      created_at: new Date(),
    }
  });

  function onSubmit(data: z.infer<typeof propertyFormSchema>) {
    const finalData = {
      ...data,
      created_at: data.created_at?.toISOString() ?? new Date().toISOString(),
      payments: [],
    };
    onPropertyAdd(finalData);
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Add New Property Defaulter</DialogTitle>
          <DialogDescription>
            Add a new property defaulter record. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="Property No" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Property No.</FormLabel>
                          <FormControl><Input readOnly {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={form.control} name="Property Name" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Property Name</FormLabel>
                          <FormControl><Input placeholder="e.g. Green Haven Apartments" {...field} value={field.value ?? ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="Owner Name" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Owner Name</FormLabel>
                          <FormControl><Input placeholder="e.g. John Doe" {...field} value={field.value ?? ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={form.control} name="Phone Number" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl><Input placeholder="e.g. 0244123456" {...field} value={field.value ?? ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="Suburb" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Suburb</FormLabel>
                          <FormControl><Input placeholder="e.g. Cantonments" {...field} value={field.value ?? ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={form.control} name="Type of Property" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Type of Property</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select property type" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Residential">Residential</SelectItem>
                                <SelectItem value="Commercial">Commercial</SelectItem>
                                <SelectItem value="Industrial">Industrial</SelectItem>
                                <SelectItem value="Agricultural">Agricultural</SelectItem>
                                <SelectItem value="Mixed">Mixed</SelectItem>
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )} 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="Amount" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount (GHS)</FormLabel>
                          <FormControl><Input type="number" step="10" {...field} value={field.value ?? 0} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={form.control} name="Rateable Value" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rateable Value</FormLabel>
                          <FormControl><Input type="number" step="10" {...field} value={field.value ?? 0} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="Rate Impost" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rate Impost</FormLabel>
                          <FormControl><Input type="number" step="0.01" {...field} value={field.value ?? 0} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={form.control} name="Sanitation Charged" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sanitation Charged</FormLabel>
                          <FormControl><Input type="number" step="10" {...field} value={field.value ?? 0} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="Previous Balance" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Previous Balance</FormLabel>
                          <FormControl><Input type="number" step="10" {...field} value={field.value ?? 0} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={form.control} name="Total Payment" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Payment</FormLabel>
                          <FormControl><Input type="number" step="10" {...field} value={field.value ?? 0} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <DialogFooter className="pt-6">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                  <Button type="submit">Add Property Defaulter</Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
