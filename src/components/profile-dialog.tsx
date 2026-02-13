
'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import type { User } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { useUserData } from '@/context/UserDataContext';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Loader2 } from 'lucide-react';

interface ProfileDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const profileFormSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters.'),
  email: z.string().email().readonly(),
  password: z.string().min(6, 'Password must be at least 6 characters.').optional().or(z.literal('')),
  confirmPassword: z.string().optional(),
  photoURL: z.string().optional(),
}).refine(data => {
    if (data.password || data.confirmPassword) {
        return data.password === data.confirmPassword;
    }
    return true;
}, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export function ProfileDialog({ isOpen, onOpenChange }: ProfileDialogProps) {
  const { user, updateAuthUser } = useAuth();
  const { updateUser } = useUserData();
  const { toast } = useToast();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
  });

  useEffect(() => {
    if (user && isOpen) {
      form.reset({
        name: user.name,
        email: user.email,
        password: '',
        confirmPassword: '',
        photoURL: user.photoURL,
      });
      setPhotoPreview(user.photoURL || null);
    }
  }, [user, form, isOpen]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setPhotoPreview(dataUrl);
        form.setValue('photoURL', dataUrl, { shouldValidate: true });
      };
      reader.readAsDataURL(file);
    }
  };


  function onSubmit(data: z.infer<typeof profileFormSchema>) {
    if (!user) return;
    setIsSaving(true);
    
    const { confirmPassword, ...userData } = data;
    const updatedUserData: User = { ...user, name: userData.name };

    if (userData.password) {
        updatedUserData.password = userData.password;
    }
    updatedUserData.photoURL = userData.photoURL;

    updateUser(updatedUserData);
    updateAuthUser(updatedUserData);

    toast({
        title: 'Profile Updated',
        description: 'Your profile details have been saved.',
    });
    setIsSaving(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>My Profile</DialogTitle>
          <DialogDescription>
            Update your personal details here.
          </DialogDescription>
        </DialogHeader>
        {user && (
          <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                 <FormItem>
                    <FormLabel>Profile Photo</FormLabel>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={photoPreview || undefined} alt={user.name} />
                        <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <FormControl>
                        <Input type="file" accept="image/*" className="max-w-[250px]" onChange={handlePhotoChange} disabled={isSaving}/>
                      </FormControl>
                    </div>
                  </FormItem>

                  <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl><Input placeholder="e.g. John Doe" {...field} disabled={isSaving}/></FormControl>
                          <FormMessage />
                      </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl><Input type="email" {...field} readOnly className="cursor-not-allowed bg-muted/50" /></FormControl>
                          <FormMessage />
                      </FormItem>
                  )} />
                  <FormField control={form.control} name="password" render={({ field }) => (
                      <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl><Input type="password" {...field} disabled={isSaving}/></FormControl>
                          <FormDescription>
                              Leave blank to keep your current password.
                          </FormDescription>
                          <FormMessage />
                      </FormItem>
                  )} />
                  <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl><Input type="password" {...field} disabled={isSaving}/></FormControl>
                          <FormMessage />
                      </FormItem>
                  )} />
                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
