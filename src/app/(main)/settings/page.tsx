'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Save, 
  Settings, 
  Palette, 
  MessageSquare, 
  LayoutDashboard, 
  ShieldCheck, 
  AlertTriangle,
  Trash2,
  RotateCcw, 
  Type,
  Paintbrush,
  Database,
  Link as LinkIcon
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { store, saveStore, clearAllStoreData } from '@/lib/store';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { usePropertyData } from '@/context/PropertyDataContext';
import { useBopData } from '@/context/BopDataContext';
import { useBillData } from '@/context/BillDataContext';
import { useActivityLogActions } from '@/context/ActivityLogContext';
import { TwoFactorSettings } from '@/components/twoFactorSettings';
import { AppearanceSettingsForm } from '@/components/appearance-settings-form';
import { useAuth } from '@/context/AuthContext';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";

const generalFormSchema = z.object({
  assemblyName: z.string().min(3, 'Assembly Name is required.'),
  postalAddress: z.string().min(5, 'Postal Address is required.'),
  contactPhone: z.string().min(10, 'Contact Phone is required.'),
  email: z.string().email('Valid email is required.'),
  gps: z.string().optional(),
  region: z.string().min(2, 'Region is required.'),
});

const smsFormSchema = z.object({
  enableSmsOnNewProperty: z.boolean().default(false),
  newPropertyMessageTemplate: z.string().max(320, "Message cannot exceed 320 chars.").optional(),
  enableSmsOnNewBop: z.boolean().default(false),
  newBopMessageTemplate: z.string().max(320, "Message cannot exceed 320 chars.").optional(),
  enableSmsOnBillGenerated: z.boolean().default(false),
  billGeneratedMessageTemplate: z.string().max(320, "Message cannot exceed 320 chars.").optional(),
  enableSmsOnPaymentReceived: z.boolean().default(false),
  paymentReceivedMessageTemplate: z.string().max(320, "Message cannot exceed 320 chars.").optional(),
  enableSmsOnNewUser: z.boolean().default(false),
  newUserMessageTemplate: z.string().max(320, "Message cannot exceed 320 chars.").optional(),
});

const integrationsFormSchema = z.object({
  arkeselApiKey: z.string().optional(),
  arkeselSenderId: z.string().max(11, "Sender ID cannot exceed 11 characters.").optional(),
});

const billDisplaySchema = z.object({
  showPropertyNo: z.boolean().default(true),
  showValuationListNo: z.boolean().default(true),
  showOwnerName: z.boolean().default(true),
  showPhoneNumber: z.boolean().default(true),
  showTown: z.boolean().default(true),
  showSuburb: z.boolean().default(true),
  showAccountNumber: z.boolean().default(true),
  showPropertyType: z.boolean().default(true),
  showAssemblyLogo: z.boolean().default(true),
  showGhanaLogo: z.boolean().default(true),
  showSignature: z.boolean().default(true),
  billWarningText: z.string().max(200, "Warning text cannot exceed 200 characters.").optional(),
  fontFamily: z.enum(['sans', 'serif', 'mono']).default('sans'),
  fontSize: z.coerce.number().min(8).max(16).default(10),
  accentColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Must be a valid hex color code (e.g., #RRGGBB or #RGB)").default('#2980D1'),
});

const PlaceholderGuide = ({ common, property, bop }: { common: string[], property: string[], bop: string[] }) => (
  <div className="mt-2 p-3 bg-muted rounded-md text-xs space-y-2">
    <p className="font-semibold">Available Placeholders:</p>
    <div className="grid grid-cols-2 gap-2">
        <div>
            <p className="text-muted-foreground underline">Common</p>
            <ul className="list-disc list-inside">
                {common.map(p => <li key={p}>{`{{${p}}}`}</li>)}
            </ul>
        </div>
        {property.length > 0 && (
            <div>
                <p className="text-muted-foreground underline">Property Only</p>
                <ul className="list-disc list-inside">
                    {property.map(p => <li key={p}>{`{{${p}}}`}</li>)}
                </ul>
            </div>
        )}
        {bop.length > 0 && (
            <div>
                <p className="text-muted-foreground underline">BOP Only</p>
                <ul className="list-disc list-inside">
                    {bop.map(p => <li key={p}>{`{{${p}}}`}</li>)}
                </ul>
            </div>
        )}
    </div>
  </div>
);

export default function SettingsPage() {
  useRequirePermission();
  const { toast } = useToast();
  const { user } = useAuth();
  const { deleteAllProperties } = usePropertyData();
  const { deleteAllBop } = useBopData();
  const { deleteAllBills } = useBillData();
  const { clearLogs } = useActivityLogActions();

  const generalForm = useForm<z.infer<typeof generalFormSchema>>({
    resolver: zodResolver(generalFormSchema),
    defaultValues: store.settings.generalSettings || {},
  });

  const smsForm = useForm<z.infer<typeof smsFormSchema>>({
    resolver: zodResolver(smsFormSchema),
    defaultValues: store.settings.smsSettings || {},
  });

  const integrationsForm = useForm<z.infer<typeof integrationsFormSchema>>({
    resolver: zodResolver(integrationsFormSchema),
    defaultValues: store.settings.integrationsSettings || {
      arkeselApiKey: '',
      arkeselSenderId: '',
    },
  });

  const billDisplayForm = useForm<z.infer<typeof billDisplaySchema>>({
    resolver: zodResolver(billDisplaySchema),
    defaultValues: store.settings.billDisplaySettings || {
        showPropertyNo: true,
        showValuationListNo: true,
        showAssemblyLogo: true,
        showGhanaLogo: true,
        showSignature: true,
        showOwnerName: true,
        showPhoneNumber: true,
        showTown: true,
        showSuburb: true,
        showAccountNumber: true,
        showPropertyType: true,
        billWarningText: "PAY AT ONCE OR FACE LEGAL ACTION",
        fontFamily: 'sans',
        fontSize: 10,
        accentColor: '#2980D1',
    },
  });

  const onGeneralSubmit = (data: z.infer<typeof generalFormSchema>) => {
    store.settings.generalSettings = data;
    saveStore();
    toast({ title: 'Settings Saved', description: 'General settings have been updated.' });
  };

  const onSmsSubmit = (data: z.infer<typeof smsFormSchema>) => {
    store.settings.smsSettings = data;
    saveStore();
    toast({ title: 'SMS Settings Saved', description: 'SMS templates and triggers have been updated.' });
  };

  const onIntegrationsSubmit = (data: z.infer<typeof integrationsFormSchema>) => {
    store.settings.integrationsSettings = data;
    saveStore();
    toast({ title: 'Integration Saved', description: 'Third-party service credentials updated.' });
  };

  const onBillDisplaySubmit = (data: z.infer<typeof billDisplaySchema>) => {
    store.settings.billDisplaySettings = data;
    saveStore();
    toast({ title: 'Display Settings Saved', description: 'Printed bill field visibility has been updated.' });
  };

  const handleFactoryReset = () => {
    clearAllStoreData();
    toast({ title: 'System Reset', description: 'All data has been wiped and settings restored to default.' });
    window.location.reload();
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">System Settings</h1>
        <p className="text-muted-foreground">Manage your assembly details, bill templates, and system maintenance.</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="bg-muted p-1 rounded-lg">
          <TabsTrigger value="general" className="flex items-center gap-2"><Settings className="h-4 w-4" /> General</TabsTrigger>
          <TabsTrigger value="sms" className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> SMS Templates</TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2"><Palette className="h-4 w-4" /> Appearance</TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2"><LinkIcon className="h-4 w-4" /> Integrations</TabsTrigger>
          <TabsTrigger value="display" className="flex items-center gap-2"><LayoutDashboard className="h-4 w-4" /> Bill Display</TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Security</TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2 text-destructive"><Database className="h-4 w-4" /> Data Management</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Assembly Information</CardTitle>
              <CardDescription>These details appear on all official bills and demand notices.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...generalForm}>
                <form onSubmit={generalForm.handleSubmit(onGeneralSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={generalForm.control} name="assemblyName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assembly Name</FormLabel>
                        <FormControl><Input placeholder="e.g. Kpandai District Assembly" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={generalForm.control} name="region" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Region</FormLabel>
                        <FormControl><Input placeholder="e.g. Northern Region" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={generalForm.control} name="postalAddress" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Address</FormLabel>
                      <FormControl><Input placeholder="e.g. P.O. Box 30, Kpandai" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={generalForm.control} name="contactPhone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Phone</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={generalForm.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Official Email</FormLabel>
                        <FormControl><Input type="email" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <Button type="submit" className="mt-4"><Save className="mr-2 h-4 w-4" /> Save Changes</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sms">
          <Card>
            <CardHeader>
              <CardTitle>SMS Automation</CardTitle>
              <CardDescription>Configure automatic SMS notifications for stakeholders.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...smsForm}>
                <form onSubmit={smsForm.handleSubmit(onSmsSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <FormField control={smsForm.control} name="enableSmsOnNewProperty" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">SMS on New Property</FormLabel>
                                <FormDescription>Send a welcome SMS when a property is registered.</FormDescription>
                            </div>
                             <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )} />
                    <FormField control={smsForm.control} name="newPropertyMessageTemplate" render={({ field }) => (
                        <FormItem>
                            <FormLabel>New Property Message Template</FormLabel>
                            <FormControl><Textarea {...field} className="min-h-[80px]"/></FormControl>
                             <PlaceholderGuide common={['Owner Name', 'Town', 'Date']} property={['Property No', 'Amount']} bop={[]} />
                            <FormMessage />
                        </FormItem>
                    )} />
                  </div>

                  <div className="border-t pt-6 space-y-4">
                     <FormField control={smsForm.control} name="enableSmsOnNewUser" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">SMS on New System User</FormLabel>
                                <FormDescription>Notify staff members when their system account is created.</FormDescription>
                            </div>
                             <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )} />
                    <FormField control={smsForm.control} name="newUserMessageTemplate" render={({ field }) => (
                        <FormItem>
                            <FormLabel>New User Welcome Template</FormLabel>
                            <FormControl><Textarea {...field} className="min-h-[80px]"/></FormControl>
                             <PlaceholderGuide common={['name', 'role', 'email', 'System Name', 'Assembly Name']} property={[]} bop={[]} />
                            <FormMessage />
                        </FormItem>
                    )} />
                  </div>

                  <div className="border-t pt-6 space-y-4">
                     <FormField control={smsForm.control} name="enableSmsOnNewBop" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">SMS on New BOP</FormLabel>
                                <FormDescription>Send a notification when a new business permit is added.</FormDescription>
                            </div>
                             <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )} />
                    <FormField control={smsForm.control} name="newBopMessageTemplate" render={({ field }) => (
                        <FormItem>
                            <FormLabel>New BOP Message Template</FormLabel>
                            <FormControl><Textarea {...field} className="min-h-[80px]"/></FormControl>
                             <PlaceholderGuide common={['Owner Name', 'Town', 'Date']} property={[]} bop={['Business Name', 'Amount']} />
                            <FormMessage />
                        </FormItem>
                    )} />
                  </div>

                  <div className="border-t pt-6 space-y-4">
                     <FormField control={smsForm.control} name="enableSmsOnPaymentReceived" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">SMS on Payment Received</FormLabel>
                                <FormDescription>Send a confirmation SMS when a manual payment is entered.</FormDescription>
                            </div>
                             <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )} />
                    <FormField control={smsForm.control} name="paymentReceivedMessageTemplate" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Payment Received Message Template</FormLabel>
                            <FormControl><Textarea {...field} className="min-h-[80px]"/></FormControl>
                             <PlaceholderGuide 
                                common={['Owner Name', 'Date', 'Amount']} 
                                property={['Property Name', 'Balance']} 
                                bop={['Business Name']} 
                            />
                            <FormMessage />
                        </FormItem>
                    )} />
                  </div>

                  <Button type="submit"><Save className="mr-2 h-4 w-4" /> Save SMS Settings</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Third-Party Integrations</CardTitle>
              <CardDescription>Configure external services like SMS gateways.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...integrationsForm}>
                <form onSubmit={integrationsForm.handleSubmit(onIntegrationsSubmit)} className="space-y-4">
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Arkesel SMS Gateway</h3>
                    <FormField control={integrationsForm.control} name="arkeselApiKey" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Arkesel API Key</FormLabel>
                        <FormControl><Input type="password" placeholder="Enter your API key" {...field} /></FormControl>
                        <FormDescription>Find this in your Arkesel account settings.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={integrationsForm.control} name="arkeselSenderId" render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMS Sender ID</FormLabel>
                        <FormControl><Input placeholder="e.g., KPDARMS" {...field} /></FormControl>
                        <FormDescription>The name displayed as the sender (max 11 chars).</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <Button type="submit" className="mt-4"><Save className="mr-2 h-4 w-4" /> Save Integration</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <AppearanceSettingsForm />
        </TabsContent>

        <TabsContent value="display">
            <Card>
                <CardHeader>
                    <CardTitle>Bill Template Customization</CardTitle>
                    <CardDescription>Customize the content and appearance of your generated bills.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...billDisplayForm}>
                        <form onSubmit={billDisplayForm.handleSubmit(onBillDisplaySubmit)} className="space-y-4">
                            <h3 className="text-lg font-semibold mt-6">Content Settings</h3>
                            <FormField control={billDisplayForm.control} name="billWarningText" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Bill Warning/Footer Text</FormLabel>
                                    <FormControl><Textarea placeholder="e.g., PAY AT ONCE OR FACE LEGAL ACTION" {...field} value={field.value ?? ''} /></FormControl>
                                    <FormDescription>This text will appear at the bottom of all generated bills.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <h3 className="text-lg font-semibold mt-6">Visual Settings</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={billDisplayForm.control} name="fontFamily" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2"><Type className="h-4 w-4" /> Font Family</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select font family" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="sans">Sans-serif (Default)</SelectItem>
                                                <SelectItem value="serif">Serif</SelectItem>
                                                <SelectItem value="mono">Monospace</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>Choose the primary font for your bills.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={billDisplayForm.control} name="fontSize" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2"><Type className="h-4 w-4" /> Base Font Size (px)</FormLabel>
                                        <FormControl><Input type="number" min={8} max={16} placeholder="e.g., 10" {...field} value={field.value ?? 10} /></FormControl>
                                        <FormDescription>Adjust the base font size for bill content (8-16px).</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                            <FormField control={billDisplayForm.control} name="accentColor" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><Paintbrush className="h-4 w-4" /> Accent Color</FormLabel>
                                    <div className="flex items-center gap-2">
                                        <FormControl><Input type="color" className="w-12 h-8 p-0 border-none" {...field} value={field.value ?? '#2980D1'} /></FormControl>
                                        <FormControl><Input type="text" placeholder="#2980D1" {...field} value={field.value ?? '#2980D1'} /></FormControl>
                                    </div>
                                    <FormDescription>Choose a hex color for highlights on your bills (e.g., borders, totals).</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <h3 className="text-lg font-semibold mt-6">Field Visibility</h3>
                            <CardDescription>Select which fields should be visible on the generated printed bills.</CardDescription>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {Object.keys(billDisplayForm.getValues()).filter(k => k.startsWith('show')).map((key) => (
                                    <FormField key={key} control={billDisplayForm.control} name={key as any} render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</FormLabel>
                                            </div>
                                        </FormItem>
                                    )} />
                                ))}
                            </div>
                            <Button type="submit" className="mt-4"><Save className="mr-2 h-4 w-4" /> Save Visibility</Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="security">
            {user && <TwoFactorSettings user={user} />}
        </TabsContent>

        <TabsContent value="maintenance">
            <div className="space-y-6">
                <Card className="border-destructive/20">
                    <CardHeader className="bg-destructive/5">
                        <CardTitle className="text-destructive flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" /> 
                            Danger Zone: Data Management
                        </CardTitle>
                        <CardDescription>
                            Actions in this section are permanent and cannot be undone. Please proceed with caution.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                            <div className="space-y-0.5">
                                <h4 className="font-semibold">Clear Properties</h4>
                                <p className="text-sm text-muted-foreground">Delete all property records from the system.</p>
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground">
                                        <Trash2 className="h-4 w-4 mr-2" /> Clear Properties
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete all properties?</AlertDialogTitle>
                                        <AlertDialogDescription>This will permanently remove all property records. You should export your data first.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={deleteAllProperties} className="bg-destructive text-destructive-foreground">Delete Everything</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                            <div className="space-y-0.5">
                                <h4 className="font-semibold">Clear BOP Records</h4>
                                <p className="text-sm text-muted-foreground">Delete all Business Operating Permit records.</p>
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground">
                                        <Trash2 className="h-4 w-4 mr-2" /> Clear BOPs
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete all BOP data?</AlertDialogTitle>
                                        <AlertDialogDescription>This will wipe all business records. This action is irreversible.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={deleteAllBop} className="bg-destructive text-destructive-foreground">Wipe Data</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                            <div className="space-y-0.5">
                                <h4 className="font-semibold">Clear Bill History</h4>
                                <p className="text-sm text-muted-foreground">Delete all previously generated bill records and history.</p>
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground">
                                        <Trash2 className="h-4 w-4 mr-2" /> Clear History
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Clear bill history?</AlertDialogTitle>
                                        <AlertDialogDescription>This will remove all generated bills from the history tab. It will not affect property data.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={deleteAllBills} className="bg-destructive text-destructive-foreground">Clear History</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                            <div className="space-y-0.5">
                                <h4 className="font-semibold">Clear Activity Logs</h4>
                                <p className="text-sm text-muted-foreground">Wipe the audit trail and system activity logs.</p>
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground">
                                        <Trash2 className="h-4 w-4 mr-2" /> Clear Logs
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Clear audit logs?</AlertDialogTitle>
                                        <AlertDialogDescription>The activity history for all users will be removed.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={clearLogs} className="bg-destructive text-destructive-foreground">Wipe Logs</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>

                        <div className="pt-6 border-t">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" className="w-full h-12 text-lg font-bold">
                                        <RotateCcw className="h-5 w-5 mr-2" /> FACTORY SYSTEM RESET
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="border-4 border-destructive">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-2xl text-destructive font-black">CRITICAL WARNING</AlertDialogTitle>
                                        <AlertDialogDescription className="text-foreground font-medium">
                                            You are about to perform a **FULL FACTORY RESET**. This will delete all Properties, BOPs, Bills, Logs, and reset all your configurations (Assembly Name, SMS templates, etc.) to default.
                                            <br/><br/>
                                            **THIS CANNOT BE UNDONE.**
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Abort</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleFactoryReset} className="bg-destructive hover:bg-red-700 text-destructive-foreground font-bold">
                                            YES, RESET ENTIRE SYSTEM
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}