'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldCheck, Key, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateTwoFactorSecret, verifyTwoFactorCode, generateQRCode } from '@/lib/twoFactorAuth';
import type { User } from '@/lib/types';
import { store, saveStore } from '@/lib/store';
import { useAuth } from '@/context/AuthContext';

interface TwoFactorSettingsProps {
  user: User;
}

export function TwoFactorSettings({ user }: TwoFactorSettingsProps) {
  const { toast } = useToast();
  const { updateAuthUser } = useAuth();
  const [isEnabling, setIsEnabling] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [tempSecret, setTempSecret] = useState<string | null>(null);
  const [tempRecoveryCodes, setTempRecoveryCodes] = useState<string[]>([]);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);

  const handleEnable2FA = async () => {
    try {
      setIsEnabling(true);
      
      const setup = generateTwoFactorSecret(user.email);
      setTempSecret(setup.secret);
      setTempRecoveryCodes(setup.recoveryCodes);
      
      const qrCodeData = await generateQRCode(setup.qrCode);
      setQrCode(qrCodeData);
      
      toast({
        title: '2FA Setup Initiated',
        description: 'Please scan the QR code with your authenticator app',
      });
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      toast({
        variant: 'destructive',
        title: 'Setup Failed',
        description: 'Could not generate 2FA secret',
      });
    } finally {
      setIsEnabling(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!tempSecret) return;

    try {
      setIsVerifying(true);
      
      const result = verifyTwoFactorCode(tempSecret, verificationCode);
      
      if (result.success) {
        const updatedUser = {
          ...user,
          twoFactorEnabled: true,
          twoFactorSecret: tempSecret,
          twoFactorRecoveryCodes: tempRecoveryCodes
        };

        const userIndex = store.users.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
          store.users[userIndex] = updatedUser;
          saveStore();
        }

        updateAuthUser(updatedUser);
        
        toast({
          title: '2FA Enabled',
          description: 'Two-factor authentication has been successfully enabled',
        });

        setTempSecret(null);
        setTempRecoveryCodes([]);
        setQrCode(null);
        setVerificationCode('');
        setShowRecoveryCodes(false);
      } else {
        toast({
          variant: 'destructive',
          title: 'Verification Failed',
          description: 'Invalid verification code',
        });
      }
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: 'Could not verify code',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisable2FA = async () => {
    try {
      setIsDisabling(true);
      
      const updatedUser = {
        ...user,
        twoFactorEnabled: false,
        twoFactorSecret: undefined,
        twoFactorRecoveryCodes: undefined
      };

      const userIndex = store.users.findIndex(u => u.id === user.id);
      if (userIndex !== -1) {
        store.users[userIndex] = updatedUser;
        saveStore();
      }

      updateAuthUser(updatedUser);
      
      toast({
        title: '2FA Disabled',
        description: 'Two-factor authentication has been disabled',
      });
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      toast({
        variant: 'destructive',
        title: 'Disable Failed',
        description: 'Could not disable 2FA',
      });
    } finally {
      setIsDisabling(false);
    }
  };

  const handleCancelSetup = () => {
    setTempSecret(null);
    setTempRecoveryCodes([]);
    setQrCode(null);
    setVerificationCode('');
    setShowRecoveryCodes(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Enhance your account security with 2FA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!user.twoFactorEnabled ? (
          <>
            {!tempSecret ? (
              <div className="space-y-4">
                <Alert>
                  <AlertTitle>Security Enhancement</AlertTitle>
                  <AlertDescription>
                    Two-factor authentication adds an extra layer of security by requiring a verification code from your authenticator app in addition to your password.
                  </AlertDescription>
                </Alert>
                <Button onClick={handleEnable2FA} disabled={isEnabling}>
                  {isEnabling ? (
                    'Generating...'
                  ) : (
                    'Enable Two-Factor Authentication'
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <h3 className="font-semibold">Scan QR Code</h3>
                  {qrCode && (
                    <div className="inline-block p-4 bg-white rounded-lg shadow-sm">
                      <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                  </p>
                  
                  {!showRecoveryCodes && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowRecoveryCodes(true)}
                    >
                      Can't scan QR code?
                    </Button>
                  )}

                  {showRecoveryCodes && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Secret Key</Label>
                      <Input 
                        value={tempSecret} 
                        readOnly 
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter this key manually into your authenticator app
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="verificationCode">Verification Code</Label>
                  <Input
                    id="verificationCode"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    disabled={isVerifying}
                    maxLength={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the verification code from your authenticator app
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleVerify2FA} 
                    disabled={isVerifying || !verificationCode.trim()}
                  >
                    {isVerifying ? 'Verifying...' : 'Verify and Enable'}
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={handleCancelSetup}
                    disabled={isVerifying}
                  >
                    Cancel
                  </Button>
                </div>

                <Alert variant="destructive">
                  <AlertTitle>Important!</AlertTitle>
                  <AlertDescription>
                    Make sure to save your recovery codes. They will be your only way to access your account if you lose your authenticator app.
                  </AlertDescription>
                </Alert>

                {tempRecoveryCodes.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Recovery Codes</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {tempRecoveryCodes.map((code, index) => (
                        <div 
                          key={index} 
                          className="bg-muted/50 p-2 rounded text-sm font-mono text-center"
                        >
                          {code}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Save these recovery codes in a secure place
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <Alert className="bg-green-50 border-green-200 text-green-800">
              <AlertTitle>2FA Enabled</AlertTitle>
              <AlertDescription>
                Two-factor authentication is currently active on your account
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Recovery Codes</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {user.twoFactorRecoveryCodes?.length || 0} remaining
                </span>
              </div>

              {user.twoFactorRecoveryCodes && (
                <div className="grid grid-cols-2 gap-2">
                  {user.twoFactorRecoveryCodes.slice(0, 4).map((code, index) => (
                    <div 
                      key={index} 
                      className="bg-muted/50 p-2 rounded text-sm font-mono text-center"
                    >
                      {code}
                    </div>
                  ))}
                </div>
              )}

              {user.twoFactorRecoveryCodes && user.twoFactorRecoveryCodes.length > 4 && (
                <p className="text-xs text-muted-foreground">
                  And {user.twoFactorRecoveryCodes.length - 4} more...
                </p>
              )}
            </div>

            <Button 
              variant="destructive" 
              onClick={handleDisable2FA} 
              disabled={isDisabling}
            >
              {isDisabling ? 'Disabling...' : 'Disable Two-Factor Authentication'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
