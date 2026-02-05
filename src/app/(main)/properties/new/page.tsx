'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { usePropertyData } from '@/context/PropertyDataContext';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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
  'created_at': z.date().optional(),
});


export default function NewPropertyPage() {
    useRequirePermission();
    const router = useRouter();
    const { addProperty } = usePropertyData();

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
            'created_at': new Date(),
        },
    });
    
    function onSubmit(data: z.infer<typeof propertyFormSchema>) {
        try {
            const finalData = {
                ...data,
                created_at: data.created_at?.toISOString() ?? new Date().toISOString(),
            };
            addProperty(finalData);
            toast({
                title: 'Property Added',
                description: `The property for ${data['NAME OF OWNER']} has been successfully created.`,
            });
            router.push('/properties');
        } catch (error) {
            console.error('Failed to save new property', error);
            toast({
                variant: 'destructive',
                title: 'Save Error',
                description: 'There was a problem saving the property.',
            });
        }
    }

  return (
    <>
        <div className="flex items-center gap-4">
             <Button asChild variant="outline" size="sm">
                <Link href="/properties">
                    Back to Properties
                </Link>
             </Button>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Add New Property</h1>
        </div>
        <div className="max-w-4xl mx-auto">
         <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Card>
                <CardHeader>
                  <CardTitle>New Property Details</CardTitle>
                  <CardDescription>Fill in the form to register a new property consistent with billing requirements.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="No" render={({ field }) => (
                        <FormItem>
                          <FormLabel>No.</FormLabel>
                          <FormControl><Input placeholder="e.g. 1" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={form.control} name="NAME OF AREA COUNCIL" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name of Area Council</FormLabel>
                          <FormControl><Input placeholder="e.g. Abetifi Area Council" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={form.control} name="NAME OF COMMUNITY" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name of Community</FormLabel>
                          <FormControl><Input placeholder="e.g. Christian Qtrs" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="BUSINESS NAME & ADD" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Name & Address</FormLabel>
                          <FormControl><Input placeholder="e.g. ABC Enterprises, Main St" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField control={form.control} name="LOCATION" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl><Input placeholder="e.g. Abetifi" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField control={form.control} name="NAME OF OWNER" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name of Owner</FormLabel>
                          <FormControl><Input placeholder="e.g. Ama Serwaa" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="SEX OF OWNER" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Sex of Owner</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                          <FormControl><Input placeholder="e.g. Retail" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField control={form.control} name="NAME TYPE OF PROPERTY" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type of Property</FormLabel>
                          <FormControl><Input placeholder="e.g. Commercial" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="DESCRIPTION OF PROPERTY" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description of Property</FormLabel>
                          <FormControl><Input placeholder="e.g. 2-story building" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField control={form.control} name="PHONE NUMBER" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl><Input placeholder="e.g. 0244123456" {...field} /></FormControl>
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
                                <FormControl><Input type="number" step="10" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                  </div>
                  
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <Button type="submit">Save Property</Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </div>
    </>
  );
}
