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
  'No': z.string().min(1, 'Serial number is required.'),
  'Property Name': z.string().min(3, 'Property Name is required.'),
  'Owner Name': z.string().min(3, 'Owner Name is required.'),
  'Phone Number': z.string().min(10, 'Phone Number must be at least 10 digits.'),
  'Type of Property': z.enum(['Residential', 'Commercial', 'Industrial', 'Agricultural', 'Mixed']),
  'Suburb': z.string().min(2, 'Suburb is required.'),
  'Amount': z.coerce.number().min(0, 'Amount must be a positive number.'),
  'created_at': z.date().optional(),
});


export default function NewPropertyPage() {
    useRequirePermission();
    const router = useRouter();
    const { addProperty, properties } = usePropertyData();

    // Auto-generate next serial number
    const getNextSerialNumber = () => {
        const year = new Date().getFullYear();
        // Filter properties from the current year and extract serial numbers
        const currentYearProperties = properties.filter(prop => {
            const no = prop['No'];
            return typeof no === 'string' && no.startsWith(`PROP/${year}/`);
        });

        if (currentYearProperties.length === 0) return `PROP/${year}/001`;

        // Extract and parse serial numbers
        const serialNumbers = currentYearProperties.map(prop => {
            const match = prop['No'].match(/PROP\/\d+\/(\d+)/);
            return match ? parseInt(match[1], 10) : 0;
        });

        const maxSerial = Math.max(...serialNumbers, 0);
        return `PROP/${year}/${String(maxSerial + 1).padStart(3, '0')}`;
    };

    const form = useForm<z.infer<typeof propertyFormSchema>>({
        resolver: zodResolver(propertyFormSchema),
        defaultValues: {
            'No': getNextSerialNumber(),
            'Property Name': '',
            'Owner Name': '',
            'Phone Number': '',
            'Type of Property': 'Residential',
            'Suburb': '',
            'Amount': 0,
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
                description: `The property "${data['Property Name']}" has been successfully created.`,
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
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField control={form.control} name="No" render={({ field }) => (
                         <FormItem>
                           <FormLabel>No.</FormLabel>
                           <FormControl><Input readOnly {...field} /></FormControl>
                           <FormMessage />
                         </FormItem>
                       )}
                     />
                     <FormField control={form.control} name="Property Name" render={({ field }) => (
                         <FormItem>
                           <FormLabel>Property Name</FormLabel>
                           <FormControl><Input placeholder="e.g. Green Haven Apartments" {...field} /></FormControl>
                           <FormMessage />
                         </FormItem>
                       )}
                     />
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField control={form.control} name="Owner Name" render={({ field }) => (
                         <FormItem>
                           <FormLabel>Owner Name</FormLabel>
                           <FormControl><Input placeholder="e.g. John Doe" {...field} /></FormControl>
                           <FormMessage />
                         </FormItem>
                       )}
                     />
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField control={form.control} name="Phone Number" render={({ field }) => (
                         <FormItem>
                           <FormLabel>Phone Number</FormLabel>
                           <FormControl><Input placeholder="e.g. 0244123456" {...field} /></FormControl>
                           <FormMessage />
                         </FormItem>
                       )}
                     />
                     <FormField control={form.control} name="Suburb" render={({ field }) => (
                         <FormItem>
                           <FormLabel>Suburb</FormLabel>
                           <FormControl><Input placeholder="e.g. Cantonments" {...field} /></FormControl>
                           <FormMessage />
                         </FormItem>
                       )}
                     />
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField control={form.control} name="Type of Property" render={({ field }) => (
                         <FormItem>
                             <FormLabel>Type of Property</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                           <FormControl><Input type="number" step="10" {...field} /></FormControl>
                           <FormMessage />
                         </FormItem>
                       )}
                     />
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
