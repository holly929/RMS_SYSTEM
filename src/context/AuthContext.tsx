'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '@/lib/types';
import { store } from '@/lib/store';
import { verifyTwoFactorCode, verifyRecoveryCode } from '@/lib/twoFactorAuth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{
    success: boolean;
    requires2FA: boolean;
    tempUser?: User;
  }>;
  verify2FA: (code: string, user: User) => Promise<boolean>;
  verifyRecoveryCode: (code: string, user: User) => Promise<boolean>;
  logout: () => void;
  updateAuthUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'rateease.user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUserJson = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUserJson) {
        setUser(JSON.parse(storedUserJson));
      }
    } catch (e) {
      console.error("Could not parse user from localStorage", e);
      localStorage.removeItem(USER_STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);


  const login = async (email: string, password: string): Promise<{
    success: boolean;
    requires2FA: boolean;
    tempUser?: User;
  }> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const foundUser = store.users.find(u => 
      u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (foundUser) {
      if (foundUser.twoFactorEnabled && foundUser.twoFactorSecret) {
        return {
          success: true,
          requires2FA: true,
          tempUser: foundUser
        };
      }

      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(foundUser));
      setUser(foundUser);
      
      return {
        success: true,
        requires2FA: false
      };
    }
    
    return {
      success: false,
      requires2FA: false
    };
  };

  const verify2FA = async (code: string, tempUser: User): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    if (!tempUser.twoFactorEnabled || !tempUser.twoFactorSecret) {
      return false;
    }

    const verificationResult = verifyTwoFactorCode(
      tempUser.twoFactorSecret,
      code
    );

    if (verificationResult.success) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(tempUser));
      setUser(tempUser);
      return true;
    }

    return false;
  };

  const verifyRecoveryCodeMethod = async (code: string, tempUser: User): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    if (!tempUser.twoFactorEnabled || !tempUser.twoFactorRecoveryCodes) {
      return false;
    }

    const verificationResult = verifyRecoveryCode(
      tempUser.twoFactorRecoveryCodes,
      code
    );

    if (verificationResult.success) {
      const updatedUser = {
        ...tempUser,
        twoFactorRecoveryCodes: verificationResult.remainingCodes
      };

      const userIndex = store.users.findIndex(u => u.id === tempUser.id);
      if (userIndex !== -1) {
        store.users[userIndex] = updatedUser;
      }

      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
      return true;
    }

    return false;
  };

  const logout = useCallback(() => {
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
  }, []);

  const updateAuthUser = (updatedUser: User) => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      verify2FA, 
      verifyRecoveryCode: verifyRecoveryCodeMethod,
      logout, 
      updateAuthUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
