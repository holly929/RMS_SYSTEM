
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/context/PermissionsContext';
import { toast } from './use-toast';

export function useRequirePermission() {
  const { user, loading: authLoading } = useAuth();
  const { hasPermission } = usePermissions();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (authLoading) {
      return; 
    }

    if (!user) {
      router.replace('/');
      return;
    }

    if (!hasPermission(user.role, pathname)) {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: "You don't have permission to view this page.",
      });
      router.replace('/dashboard');
    }
  }, [user, authLoading, hasPermission, pathname, router]);
}
