import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'approver' | 'loan_officer';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: UserRole }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isStaffRole(role: unknown): role is UserRole {
  return role === 'admin' || role === 'approver' || role === 'loan_officer';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchUserRole = async (supabaseUser: User): Promise<{ user: AuthUser | null; error?: string }> => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', supabaseUser.id)
        .maybeSingle();

      if (error) throw error;

      if (!data || !isStaffRole(data.role)) {
        const message = 'This account does not have an authorised staff role.';
        setUser(null);
        setAuthError(message);
        return { user: null, error: message };
      }

      const staffUser: AuthUser = {
        id: supabaseUser.id,
        name: supabaseUser.email?.split('@')[0] || 'Staff',
        email: supabaseUser.email || '',
        role: data.role,
      };

      setUser(staffUser);
      return { user: staffUser };
    } catch (error) {
      console.error('Error verifying staff role:', error);
      const message = 'Unable to verify your staff permissions. Please try again.';
      setUser(null);
      setAuthError(message);
      return { user: null, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initialiseSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        setAuthError('Unable to restore your session. Please sign in again.');
        setIsLoading(false);
        return;
      }

      setSession(data.session);

      if (data.session?.user) {
        await fetchUserRole(data.session.user);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    };

    void initialiseSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;

      setSession(newSession);

      if (newSession?.user) {
        // Defer Supabase calls to avoid running database requests inside the auth callback.
        setTimeout(() => {
          if (mounted) void fetchUserRole(newSession.user);
        }, 0);
      } else {
        setUser(null);
        setAuthError(null);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; role?: UserRole }> => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setIsLoading(false);
        return { success: false, error: error.message };
      }

      if (!data.user) {
        setIsLoading(false);
        return { success: false, error: 'Unable to identify your account.' };
      }

      setSession(data.session);
      const result = await fetchUserRole(data.user);

      if (!result.user) {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setAuthError(result.error || 'Staff access could not be verified.');
        return { success: false, error: result.error };
      }

      return { success: true, role: result.user.role };
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return { success: false, error: 'An unexpected error occurred while signing in.' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setAuthError(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      login,
      logout,
      isAuthenticated: !!session && !!user,
      isLoading,
      authError,
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
