// c:/Users/ANEH MATHEW/RMS_SYSTEM/src/components/appearance-settings-form.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { store, saveStore } from '@/lib/store';
import { Loader2, UploadCloud, XCircle } from 'lucide-react';
import Image from 'next/image';

type AppearanceSettings = {
  assemblyLogo?: string;
  ghanaLogo?: string;
  signature?: string;
  fontFamily?: 'sans' | 'serif' | 'mono';
  fontSize?: number;
  accentColor?: string;
  billWarningText?: string;
};

export function AppearanceSettingsForm() {
  const { toast } = useToast();
  const [assemblyLogo, setAssemblyLogo] = useState<string | undefined>(undefined);
  const [ghanaLogo, setGhanaLogo, ] = useState<string | undefined>(undefined);
  const [signature, setSignature] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load initial settings from the store
    const currentSettings: AppearanceSettings = store.settings.appearanceSettings || {};
    setAssemblyLogo(currentSettings.assemblyLogo);
    setGhanaLogo(currentSettings.ghanaLogo);
    setSignature(currentSettings.signature);
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string | undefined>>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setter(undefined);
    }
  };

  const handleRemoveImage = (setter: React.Dispatch<React.SetStateAction<string | undefined>>) => {
    setter(undefined);
  };

  const handleSave = () => {
    setIsSaving(true);
    try {
      if (!store.settings.appearanceSettings) {
        store.settings.appearanceSettings = {};
      }
      store.settings.appearanceSettings.assemblyLogo = assemblyLogo;
      store.settings.appearanceSettings.ghanaLogo = ghanaLogo;
      store.settings.appearanceSettings.signature = signature;
      saveStore();
      toast({
        title: "Settings Saved",
        description: "Appearance settings have been updated successfully.",
      });
    } catch (error) {
      console.error("Failed to save appearance settings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save appearance settings.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderImageUploader = (
    label: string,
    currentImage: string | undefined,
    setter: React.Dispatch<React.SetStateAction<string | undefined>>
  ) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-4">
        <div className="relative w-24 h-24 border rounded-md flex items-center justify-center overflow-hidden bg-muted">
          {currentImage ? (
            <>
              <Image src={currentImage} alt={label} layout="fill" objectFit="contain" />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 rounded-full"
                onClick={() => handleRemoveImage(setter)}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <UploadCloud className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <Input
          id={`upload-${label.toLowerCase().replace(/\s/g, '-')}`}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileChange(e, setter)}
          className="flex-1"
        />
      </div>
      {currentImage && <p className="text-xs text-muted-foreground">Image will be stored as Base64.</p>}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance Settings</CardTitle>
        <CardDescription>
          Customize the visual elements of your bills and documents. Upload logos and signatures.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderImageUploader("Assembly Logo", assemblyLogo, setAssemblyLogo)}
        {renderImageUploader("Ghana Coat of Arms Logo", ghanaLogo, setGhanaLogo)}
        {renderImageUploader("Coordinating Director Signature", signature, setSignature)}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save Appearance Settings
        </Button>
      </CardFooter>
    </Card>
  );
}