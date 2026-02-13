'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Landmark, Loader2, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { store } from '@/lib/store';
import { useAuth } from '@/context/AuthContext';

const USER_STORAGE_KEY = 'rateease.user';

type LoginStage = 'credentials' | '2fa' | 'recovery';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading, login, verify2FA, verifyRecoveryCode } = useAuth();
  
  const [systemName, setSystemName] = React.useState('RateEase');
  const [assemblyLogo, setAssemblyLogo] = React.useState<string | null>(null);
  const [email, setEmail] = React.useState('admin@rateease.gov');
  const [password, setPassword] = React.useState('password');
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [stage, setStage] = React.useState<LoginStage>('credentials');
  const [verificationCode, setVerificationCode] = React.useState('');
  const [tempUser, setTempUser] = React.useState<any>(null);

  React.useEffect(() => {
    const generalSettings = store.settings.generalSettings;
    const appearanceSettings = store.settings.appearanceSettings;

    if (generalSettings && generalSettings.systemName) {
      setSystemName(generalSettings.systemName);
    }
    if (appearanceSettings && appearanceSettings.assemblyLogo) {
      setAssemblyLogo(appearanceSettings.assemblyLogo);
    }
  }, []);
  
  React.useEffect(() => {
    if (!loading && user) {
        router.replace('/dashboard');
    }
  }, [user, loading, router]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    const result = await login(email, password);

    if (result.success) {
      if (result.requires2FA && result.tempUser) {
        setTempUser(result.tempUser);
        setStage('2fa');
      } else {
        toast({
          title: 'Login Successful',
          description: `Welcome back!`,
        });
        router.push('/dashboard');
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Invalid email or password. Please try again.',
      });
    }
    
    setIsLoggingIn(false);
  };

  const handle2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    if (!tempUser) return;

    const success = await verify2FA(verificationCode, tempUser);

    if (success) {
      toast({
        title: 'Login Successful',
        description: `Welcome back!`,
      });
      router.push('/dashboard');
    } else {
      toast({
        variant: 'destructive',
        title: '2FA Verification Failed',
        description: 'Invalid verification code. Please try again.',
      });
    }
    
    setIsLoggingIn(false);
  };

  const handleRecoveryVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    if (!tempUser) return;

    const success = await verifyRecoveryCode(verificationCode, tempUser);

    if (success) {
      toast({
        title: 'Login Successful',
        description: `Welcome back!`,
      });
      router.push('/dashboard');
    } else {
      toast({
        variant: 'destructive',
        title: 'Recovery Code Failed',
        description: 'Invalid recovery code. Please try again.',
      });
    }
    
    setIsLoggingIn(false);
  };

  const switchToRecovery = () => {
    setStage('recovery');
    setVerificationCode('');
  };

  const switchTo2FA = () => {
    setStage('2fa');
    setVerificationCode('');
  };

  if(loading || (!loading && user)) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (stage === '2fa') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
         <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/20 via-background to-background dark:from-primary/10 animate-gradient-xy"></div>
         <div className="relative z-10 w-full max-w-md">
          <Card className="shadow-2xl animate-fade-in-up bg-card/80 backdrop-blur-lg">
            <CardHeader className="text-center p-6">
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center text-primary overflow-hidden">
                 {assemblyLogo ? (
                  <img src={assemblyLogo} alt="Assembly Logo" style={{height: '100%', width: '100%', objectFit: 'contain'}} />
                ) : (
                  <ShieldCheck className="h-12 w-12" />
                )}
              </div>
              <CardTitle className="font-headline text-3xl">{systemName}</CardTitle>
              <CardDescription>Two-Factor Authentication</CardDescription>
            </CardHeader>
            <form onSubmit={handle2FAVerify}>
              <CardContent className="space-y-6 px-6">
                <div className="space-y-2">
                  <Label htmlFor="verificationCode">Verification Code</Label>
                  <Input
                    id="verificationCode"
                    type="text"
                    placeholder="Enter 6-digit code"
                    required
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    disabled={isLoggingIn}
                    maxLength={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the verification code from your authenticator app (Google Authenticator, Authy, etc.)
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col px-6 pb-6 pt-4 space-y-3">
                <Button type="submit" className="w-full" size="lg" disabled={isLoggingIn || !verificationCode.trim()}>
                  {isLoggingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify & Sign In
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full" 
                  onClick={switchToRecovery}
                  disabled={isLoggingIn}
                >
                  Use Recovery Code
                </Button>
              </CardFooter>
            </form>
          </Card>
          <p className="mt-4 text-center text-sm text-muted-foreground animate-fade-in-up animation-delay-300">
            BUILT AND DEVELOPED BY ANEH TECH CONSORTIUM.
          </p>
        </div>
      </main>
    );
  }

  if (stage === 'recovery') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
         <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/20 via-background to-background dark:from-primary/10 animate-gradient-xy"></div>
         <div className="relative z-10 w-full max-w-md">
          <Card className="shadow-2xl animate-fade-in-up bg-card/80 backdrop-blur-lg">
            <CardHeader className="text-center p-6">
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center text-primary overflow-hidden">
                 {assemblyLogo ? (
                  <img src={assemblyLogo} alt="Assembly Logo" style={{height: '100%', width: '100%', objectFit: 'contain'}} />
                ) : (
                  <ShieldCheck className="h-12 w-12" />
                )}
              </div>
              <CardTitle className="font-headline text-3xl">{systemName}</CardTitle>
              <CardDescription>Recovery Code</CardDescription>
            </CardHeader>
            <form onSubmit={handleRecoveryVerify}>
              <CardContent className="space-y-6 px-6">
                <div className="space-y-2">
                  <Label htmlFor="recoveryCode">Recovery Code</Label>
                  <Input
                    id="recoveryCode"
                    type="text"
                    placeholder="Enter recovery code"
                    required
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    disabled={isLoggingIn}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter one of your 10 recovery codes
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col px-6 pb-6 pt-4 space-y-3">
                <Button type="submit" className="w-full" size="lg" disabled={isLoggingIn || !verificationCode.trim()}>
                  {isLoggingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify & Sign In
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full" 
                  onClick={switchTo2FA}
                  disabled={isLoggingIn}
                >
                  Use Verification Code
                </Button>
              </CardFooter>
            </form>
          </Card>
          <p className="mt-4 text-center text-sm text-muted-foreground animate-fade-in-up animation-delay-300">
            BUILT AND DEVELOPED BY ANEH TECH CONSORTIUM.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
       <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/20 via-background to-background dark:from-primary/10 animate-gradient-xy"></div>
       <div className="relative z-10 w-full max-w-md">
        <Card className="shadow-2xl animate-fade-in-up bg-card/80 backdrop-blur-lg">
          <CardHeader className="text-center p-6">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center text-primary overflow-hidden">
               {assemblyLogo ? (
                <img src={assemblyLogo} alt="Assembly Logo" style={{height: '100%', width: '100%', objectFit: 'contain'}} />
              ) : (
                <Landmark className="h-12 w-12" />
              )}
            </div>
            <CardTitle className="font-headline text-3xl">{systemName}</CardTitle>
            <CardDescription>District Assembly Revenue Mobilization</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-6 px-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoggingIn}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoggingIn}
                />
              </div>
            </CardContent>
            <CardFooter className="px-6 pb-6 pt-4">
              <Button type="submit" className="w-full" size="lg" disabled={isLoggingIn}>
                {isLoggingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </CardFooter>
          </form>
        </Card>
        <p className="mt-4 text-center text-sm text-muted-foreground animate-fade-in-up animation-delay-300">
          BUILT AND DEVELOPED BY ANEH TECH CONSORTIUM.
        </p>
      </div>
    </main>
  );
}
