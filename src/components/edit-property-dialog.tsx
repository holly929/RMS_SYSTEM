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

interface EditPropertyDialogProps {
  property: Property | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onPropertyUpdate: (property: Property) => void;
}

const propertyFormSchema = z.object({
  'No': z.string().min(1, 'No. is required.'),
  'NAME OF AREA COUNCIL': z.string().min(2, 'Name of Area Council is required.'),
  'NAME OF COMMUNITY': z.string().min(2, 'Name of Community is required.'),
  'BUSINESS NAME & ADD': z.string().min(3, 'Business Name & Address is required.'),
  'LOCATION': z.string().min(2, 'Location is required.'),
  'NAME OF OWNER': z.string().min(3, 'Name of Owner is required.'),
  'SEX OF OWNER': z.enum(['Male', 'Female', 'Other']),
  'BUSINESS CATEGORY': z.string().min(2, 'Business Category is required.'),
  'DESCRIPTION OF PROPERTY': z.string().optional(),
  'NAME TYPE OF PROPERTY': z.string().min(2, 'Type of Property is required.'),
  'PHONE NUMBER': z.string().optional(),
  'AMOUNT': z.coerce.number().min(0, 'Amount must be a positive number.'),
});

export function EditPropertyDialog({
  property,
  isOpen,
  onOpenChange,
  onPropertyUpdate,
}: EditPropertyDialogProps) {
  
  const form = useForm<z.infer<typeof propertyFormSchema>>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
        'No': '',
        'NAME OF AREA COUNCIL': '',
        'NAME OF COMMUNITY': '',
        'BUSINESS NAME & ADD': '',
        'LOCATION': '',
        'NAME OF OWNER': '',
        'SEX OF OWNER': 'Male',
        'BUSINESS CATEGORY': '',
        'DESCRIPTION OF PROPERTY': '',
        'NAME TYPE OF PROPERTY': '',
        'PHONE NUMBER': '',
        'AMOUNT': 0,
    }
  });

  useEffect(() => {
    if (property && isOpen) {
       const normalizedData = {
        'No': getPropertyValue(property, 'No'),
        'NAME OF AREA COUNCIL': getPropertyValue(property, 'NAME OF AREA COUNCIL'),
        'NAME OF COMMUNITY': getPropertyValue(property, 'NAME OF COMMUNITY'),
        'BUSINESS NAME & ADD': getPropertyValue(property, 'BUSINESS NAME & ADD'),
        'LOCATION': getPropertyValue(property, 'LOCATION'),
        'NAME OF OWNER': getPropertyValue(property, 'NAME OF OWNER'),
        'SEX OF OWNER': getPropertyValue(property, 'SEX OF OWNER'),
        'BUSINESS CATEGORY': getPropertyValue(property, 'BUSINESS CATEGORY'),
        'DESCRIPTION OF PROPERTY': getPropertyValue(property, 'DESCRIPTION OF PROPERTY'),
        'NAME TYPE OF PROPERTY': getPropertyValue(property, 'NAME TYPE OF PROPERTY'),
        'PHONE NUMBER': getPropertyValue(property, 'PHONE NUMBER'),
        'AMOUNT': getPropertyValue(property, 'AMOUNT'),
      };
      
      const finalData: Record<string, any> = {};
      for (const key in normalizedData) {
        const value = (normalizedData as any)[key];
        if (value !== undefined) {
            finalData[key] = value;
        }
      }

      form.reset(finalData);
    }
  }, [property, isOpen, form]);

  function onSubmit(data: z.infer<typeof propertyFormSchema>) {
    if (property) {
      onPropertyUpdate({ ...property, ...data });
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Edit Property</DialogTitle>
          <DialogDescription>
            Make changes to the property details below. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="No" render={({ field }) => (
                        <FormItem>
                          <FormLabel>No.</FormLabel>
                          <FormControl><Input placeholder="e.g. 1" {...field} value={field.value ?? ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={form.control} name="NAME OF AREA COUNCIL" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name of Area Council</FormLabel>
                          <FormControl><Input placeholder="e.g. Abetifi Area Council" {...field} value={field.value ?? ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={form.control} name="NAME OF COMMUNITY" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name of Community</FormLabel>
                          <FormControl><Input placeholder="e.g. Christian Qtrs" {...field} value={field.value ?? ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="BUSINESS NAME & ADD" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Name & Address</FormLabel>
                          <FormControl><Input placeholder="e.g. ABC Enterprises, Main St" {...field} value={field.value ?? ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField control={form.control} name="LOCATION" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl><Input placeholder="e.g. Abetifi" {...field} value={field.value ?? ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField control={form.control} name="NAME OF OWNER" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name of Owner</FormLabel>
                          <FormControl><Input placeholder="e.g. Ama Serwaa" {...field} value={field.value ?? ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="SEX OF OWNER" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Sex of Owner</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select sex" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Male">Male</SelectItem>
                                <SelectItem value="Female">Female</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )} 
                    />
                     <FormField control={form.control} name="BUSINESS CATEGORY" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Category</FormLabel>
                          <FormControl><Input placeholder="e.g. Retail" {...field} value={field.value ?? ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField control={form.control} name="NAME TYPE OF PROPERTY" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type of Property</FormLabel>
                          <FormControl><Input placeholder="e.g. Commercial" {...field} value={field.value ?? ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="DESCRIPTION OF PROPERTY" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description of Property</FormLabel>
                          <FormControl><Input placeholder="e.g. 2-story building" {...field} value={field.value ?? ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField control={form.control} name="PHONE NUMBER" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl><Input placeholder="e.g. 0244123456" {...field} value={field.value ?? ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-lg font-medium">Billing Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                        <FormField control={form.control} name="AMOUNT" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Amount (GHS)</FormLabel>
                                <FormControl><Input type="number" step="10" {...field} value={field.value ?? 0} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                  </div>
                  
                </div>
                <DialogFooter className="pt-6">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                  <Button type="submit">Save Changes</Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
