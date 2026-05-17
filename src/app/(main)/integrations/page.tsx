
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BookCopy, AlertCircle, Loader2, Info, Server } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { store, saveStore } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AppearanceSettingsForm } from '@/components/appearance-settings-form';

const getEditableSheetUrl = (originalUrl: string): string => {
  if (!originalUrl) return '';
  const regex = /spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
  const match = originalUrl.match(regex);
  if (match && match[1]) {
    const sheetId = match[1];
    return `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
  }
  return '';
};

function GoogleSheetIntegration({ settingKey, title, description, emptyStateText }: { settingKey: 'googleSheetUrl' | 'bopGoogleSheetUrl' | 'summaryBillGoogleSheetUrl', title: string, description: string, emptyStateText: string }) {
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const integrationsSettings = store.settings.integrationsSettings;
    if (integrationsSettings && integrationsSettings[settingKey]) {
        setSheetUrl(getEditableSheetUrl(integrationsSettings[settingKey]));
    }
    setIsLoading(false);
  }, [settingKey]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : sheetUrl ? (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Having trouble editing?</AlertTitle>
              <AlertDescription>
                To view and edit the sheet, you must be logged into the correct Google account in this browser. If the sheet doesn't load, try opening it in a new tab first, then refresh this page.
              </AlertDescription>
            </Alert>
            <div className="aspect-video w-full rounded-lg border">
              <iframe
                src={sheetUrl}
                className="w-full h-full"
                frameBorder="0"
                title="Embedded Google Sheet"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              >
                Loading...
              </iframe>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center h-[calc(100vh-30rem)]">
            <BookCopy className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">{emptyStateText}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Please go to the <Button variant="link" asChild className="p-0 h-auto"><Link href="/settings">Settings</Link></Button> page to connect a Google Sheet.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SmsIntegrationCard() {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState(''); // API key is not persisted for security
  const [senderId, setSenderId] = useState(store.settings.integrationsSettings?.arkeselSenderId || 'KPDARMS');
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsLoading] = useState(false);

  const handleSave = () => {
    setIsLoading(true);
    try {
      if (!store.settings.integrationsSettings) {
        store.settings.integrationsSettings = {};
      }
      store.settings.integrationsSettings.arkeselSenderId = senderId;
      saveStore();
      toast({
        title: "Settings Saved",
        description: "SMS integration settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestSms = async () => {
    if (!testPhoneNumber.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Phone Number",
        description: "Please enter a phone number to send a test SMS to.",
      });
      return;
    }

    if (!apiKey) {
      toast({
        variant: "destructive",
        title: "Missing API Key",
        description: "Please enter your Arkesel API key first.",
      });
      return;
    }

    setIsTesting(true);
    try {
      const response = await fetch('/api/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phoneNumber: testPhoneNumber, 
          message: `Test message from ${store.settings.generalSettings?.systemName || 'RateEase'}. Your SMS integration is working correctly!`,
          apiKey: apiKey,
          senderId: senderId
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({ title: "Test Successful", description: `A test SMS has been sent to ${testPhoneNumber}.` });
      } else {
        toast({ variant: "destructive", title: "Test Failed", description: result.error || "Failed to send test SMS." });
      }
    } catch (error) {
      console.error('Test SMS error:', error);
      toast({ variant: "destructive", title: "Network Error", description: "Could not connect to the SMS service." });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Arkesel SMS Integration</CardTitle>
        <CardDescription>
          Configure your Arkesel API credentials to enable automated SMS notifications.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-primary/5 border-primary/20">
          <Info className="h-4 w-4" />
          <AlertTitle>Security Configuration</AlertTitle>
          <AlertDescription className="text-xs">
            For production builds on Vercel, the <strong>Arkesel API Key</strong> should be set as an environment variable (<code>ARKESEL_API_KEY</code>). 
            The field below is used for testing and is not saved to local storage.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="apiKey">Arkesel API Key (Testing Only)</Label>
          <Input 
            id="apiKey" 
            type="password" 
            placeholder="••••••••••••••••" 
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <p className="text-xs text-muted-foreground italic">Managed via Vercel Environment Variables in production.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="senderId">Sender ID</Label>
          <Input 
            id="senderId" 
            placeholder="e.g., KPDARMS" 
            value={senderId}
            maxLength={11}
            onChange={(e) => setSenderId(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">The name that appears as the sender (max 11 characters).</p>
        </div>

        <div className="pt-4 border-t space-y-4">
          <div className="space-y-2">
            <Label htmlFor="testPhone">Test Phone Number</Label>
            <div className="flex gap-2">
              <Input 
                id="testPhone" 
                placeholder="e.g., 0244123456" 
                value={testPhoneNumber}
                onChange={(e) => setTestPhoneNumber(e.target.value)}
              />
              <Button variant="secondary" onClick={handleTestSms} disabled={isTesting || !testPhoneNumber.trim()}>
                {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test SMS"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Verify your credentials by sending a test message before saving.</p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save Configuration
        </Button>
      </CardFooter>
    </Card>
  )
}

export default function IntegrationsPage() {
  useRequirePermission();

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Integrations</h1>
      </div>
      
      <Tabs defaultValue="sheets" className="w-full">
        <TabsList className="flex flex-wrap h-auto w-full gap-1 bg-muted p-1 rounded-lg">
          <TabsTrigger value="sheets">Property Rates Sheet</TabsTrigger>
          <TabsTrigger value="bop-sheets">BOP Sheet</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>
        <TabsContent value="sheets">
          <GoogleSheetIntegration 
            settingKey="googleSheetUrl"
            title="Property Rate Payments"
            description="View and edit your connected property rate payments spreadsheet."
            emptyStateText="No Property Rate Spreadsheet Connected"
          />
        </TabsContent>
        <TabsContent value="bop-sheets">
          <GoogleSheetIntegration 
            settingKey="bopGoogleSheetUrl"
            title="BOP Payments"
            description="View and edit your connected Business Operating Permit (BOP) payments spreadsheet."
            emptyStateText="No BOP Spreadsheet Connected"
          />
        </TabsContent>
         <TabsContent value="sms">
          <SmsIntegrationCard />
        </TabsContent>
        <TabsContent value="appearance">
          <AppearanceSettingsForm />
        </TabsContent>
      </Tabs>
    </>
  );
}
