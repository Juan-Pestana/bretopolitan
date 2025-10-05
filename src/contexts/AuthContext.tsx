'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { User, AuthState } from '@/types/auth';
import { getCurrentUser, signOut } from '@/lib/auth';

interface AuthContextType extends AuthState {
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const { user: currentUser, error: userError } = await getCurrentUser();

      if (userError) {
        setError(userError.message);
        setUser(null);
      } else {
        setUser(currentUser);
      }
    } catch {
      setError('Failed to load user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      const { error: logoutError } = await signOut();

      if (logoutError) {
        setError(logoutError.message);
      } else {
        setUser(null);
        setError(null);
        // Wait a moment for the session to be cleared, then redirect
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    } catch {
      setError('Failed to logout');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    error,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
