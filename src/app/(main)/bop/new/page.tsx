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
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useBopData } from '@/context/BopDataContext';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { Select } from '@/components/ui/select';

const bopFormSchema = z.object({
  'No': z.string().min(1, 'Serial number is required.'),
  'NAME OF AREA COUNCIL': z.string().min(3, 'Name of area council is required.'),
  'NAME OF COMMUNITY': z.string().min(3, 'Name of community is required.'),
  'BUSINESS NAME & ADD': z.string().min(3, 'Business name is required.'),
  'NAME OF OWNER': z.string().min(3, 'Name of owner is required.'),
  'SEX OF OWNER': z.string().min(1, 'Sex of owner is required.'),
  'BUSINESS CATEGORY': z.string().min(3, 'Business category is required.'),
  'DESCRIPTION OF BUSINESS': z.string().min(3, 'Description of business is required.'),
  'AMOUNT': z.coerce.number().min(0, 'Amount must be a positive number.'),
  'Phone Number': z.string().min(10, 'Phone number must be at least 10 digits.'),
});


export default function NewBopPage() {
    useRequirePermission();
    const router = useRouter();
    const { addBop, bopData } = useBopData();

    // Auto-generate next serial number
    const getNextSerialNumber = () => {
        const year = new Date().getFullYear();
        // Filter BOPs from the current year and extract serial numbers
        const currentYearBops = bopData.filter(bop => {
            const no = bop['No'];
            return typeof no === 'string' && no.startsWith(`BOP/${year}/`);
        });

        if (currentYearBops.length === 0) return `BOP/${year}/001`;

        // Extract and parse serial numbers
        const serialNumbers = currentYearBops.map(bop => {
            const match = bop['No'].match(/BOP\/\d+\/(\d+)/);
            return match ? parseInt(match[1], 10) : 0;
        });

        const maxSerial = Math.max(...serialNumbers, 0);
        return `BOP/${year}/${String(maxSerial + 1).padStart(3, '0')}`;
    };

    const form = useForm<z.infer<typeof bopFormSchema>>({
        resolver: zodResolver(bopFormSchema),
        defaultValues: {
          'No': getNextSerialNumber(),
          'NAME OF AREA COUNCIL': '',
          'NAME OF COMMUNITY': '',
          'BUSINESS NAME & ADD': '',
          'NAME OF OWNER': '',
          'SEX OF OWNER': '',
          'BUSINESS CATEGORY': '',
          'DESCRIPTION OF BUSINESS': '',
          'AMOUNT': 0,
          'Phone Number': '',
        },
    });

    function onSubmit(data: z.infer<typeof bopFormSchema>) {
        try {
            addBop(data);
            toast({
                title: 'BOP Record Added',
                description: `The BOP record for ${data['BUSINESS NAME & ADD']} has been successfully created.`,
            });
            router.push('/bop');
        } catch (error) {
            console.error('Failed to save new BOP record', error);
            toast({
                variant: 'destructive',
                title: 'Save Error',
                description: 'There was a problem saving the BOP record.',
            });
        }
    }

  return (
    <>
        <div className="flex items-center gap-4">
             <Button asChild variant="outline" size="sm">
                <Link href="/bop">
                    Back to BOP Data
                </Link>
             </Button>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Add New BOP Record</h1>
        </div>
        <div className="max-w-4xl mx-auto">
         <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Card>
                <CardHeader>
                  <CardTitle>New BOP Record Details</CardTitle>
                  <CardDescription>Fill in the form to register a new Business Operating Permit.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="No" render={({ field }) => (
                        <FormItem>
                          <FormLabel>No.</FormLabel>
                          <FormControl><Input type="number" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={form.control} name="NAME OF AREA COUNCIL" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name of Area Council</FormLabel>
                          <FormControl><Input placeholder="e.g. Adom Trading" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="NAME OF COMMUNITY" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name of Community</FormLabel>
                          <FormControl><Input placeholder="e.g. Adom Trading" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={form.control} name="BUSINESS NAME & ADD" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Name & Address</FormLabel>
                          <FormControl><Input placeholder="e.g. Yaw Mensah" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="NAME OF OWNER" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name of Owner</FormLabel>
                          <FormControl><Input placeholder="e.g. Abetifi" {...field} /></FormControl>
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
                          <FormControl><Input placeholder="e.g. Abetifi" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="DESCRIPTION OF BUSINESS" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description of Business</FormLabel>
                          <FormControl><Input placeholder="e.g. Abetifi" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={form.control} name="AMOUNT" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl><Input type="number" step="10" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="Phone Number" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl><Input type="tel" placeholder="e.g. 0244123456" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <Button type="submit">Save BOP Record</Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </div>
    </>
  );
}