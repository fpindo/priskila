'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '@priskila/types';
import { ApiService, apiClient } from '@priskila/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
    remember?: boolean
  ) => Promise<{ twoFactorRequired: boolean; userId?: number } | void>;
  verify2fa: (userId: number, code: string, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogoutState = React.useCallback(() => {
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      delete apiClient.defaults.headers.common['Authorization'];
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (storedToken) {
        try {
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          setToken(storedToken);

          const response = await ApiService.get<{ user: User }>('/auth/me');
          if (response.success && response.data.user) {
            setUser(response.data.user);
          } else {
            handleLogoutState();
          }
        } catch (error) {
          console.error('Auth initialization failed:', error);
          handleLogoutState();
        }
      } else {
        handleLogoutState();
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, [handleLogoutState]);

  const login = async (email: string, password: string, remember: boolean = false) => {
    setIsLoading(true);
    try {
      const response = await ApiService.post<any>('/auth/login', {
        email,
        password,
      });

      if (response.success && response.data) {
        if (response.data.two_factor_required) {
          return { twoFactorRequired: true, userId: response.data.user_id };
        }

        const { token: userToken, user: userData } = response.data;

        if (remember) {
          localStorage.setItem('token', userToken);
        } else {
          sessionStorage.setItem('token', userToken);
        }

        apiClient.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
        setToken(userToken);
        setUser(userData);

        router.push('/');
        return { twoFactorRequired: false };
      } else {
        throw new Error(response.message || 'Login gagal.');
      }
    } catch (error) {
      handleLogoutState();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verify2fa = async (userId: number, code: string, remember: boolean = false) => {
    setIsLoading(true);
    try {
      const response = await ApiService.post<{ token: string; user: User }>('/auth/2fa/verify', {
        user_id: userId,
        code,
      });

      if (response.success && response.data) {
        const { token: userToken, user: userData } = response.data;

        if (remember) {
          localStorage.setItem('token', userToken);
        } else {
          sessionStorage.setItem('token', userToken);
        }

        apiClient.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
        setToken(userToken);
        setUser(userData);

        router.push('/');
      } else {
        throw new Error(response.message || 'Kode verifikasi salah.');
      }
    } catch (error) {
      handleLogoutState();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await ApiService.post('/auth/logout');
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      handleLogoutState();
      router.push('/login');
      setIsLoading(false);
    }
  };

  // Route guarding
  useEffect(() => {
    if (isLoading) return;

    const publicPages = ['/login', '/'];
    const isPublicPage = publicPages.includes(pathname);

    if (!user && !isPublicPage) {
      router.replace('/login');
    } else if (user && isPublicPage) {
      router.replace('/dashboard');
    }
  }, [user, isLoading, pathname, router]);

  const showLoading = isLoading && !['/login', '/'].includes(pathname);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        verify2fa,
        logout,
      }}
    >
      {showLoading ? (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-[#2563EB] dark:border-slate-800 dark:border-t-blue-500" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Menghubungkan ke sistem...
            </span>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
