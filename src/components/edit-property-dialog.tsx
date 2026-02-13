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
  'Property Name': z.string().min(3, 'Property Name is required.'),
  'Owner Name': z.string().min(3, 'Owner Name is required.'),
  'Phone Number': z.string().min(10, 'Phone Number must be at least 10 digits.'),
  'Type of Property': z.enum(['Residential', 'Commercial', 'Industrial', 'Agricultural', 'Mixed']),
  'Suburb': z.string().min(2, 'Suburb is required.'),
  'Amount': z.coerce.number().min(0, 'Amount must be a positive number.'),
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
        'Property Name': '',
        'Owner Name': '',
        'Phone Number': '',
        'Type of Property': 'Residential',
        'Suburb': '',
        'Amount': 0,
    }
  });

  useEffect(() => {
    if (property && isOpen) {
       const normalizedData = {
        'Property Name': getPropertyValue(property, 'Property Name'),
        'Owner Name': getPropertyValue(property, 'Owner Name'),
        'Phone Number': getPropertyValue(property, 'Phone Number'),
        'Type of Property': getPropertyValue(property, 'Type of Property'),
        'Suburb': getPropertyValue(property, 'Suburb'),
        'Amount': getPropertyValue(property, 'Amount'),
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="Property Name" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Property Name</FormLabel>
                          <FormControl><Input placeholder="e.g. Green Haven Apartments" {...field} value={field.value ?? ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={form.control} name="Owner Name" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Owner Name</FormLabel>
                          <FormControl><Input placeholder="e.g. John Doe" {...field} value={field.value ?? ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="Phone Number" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl><Input placeholder="e.g. 0244123456" {...field} value={field.value ?? ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={form.control} name="Suburb" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Suburb</FormLabel>
                          <FormControl><Input placeholder="e.g. Cantonments" {...field} value={field.value ?? ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <FormField control={form.control} name="Amount" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount (GHS)</FormLabel>
                          <FormControl><Input type="number" step="10" {...field} value={field.value ?? 0} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
