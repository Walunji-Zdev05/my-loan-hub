import React, { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { isStaffRole, StaffRole } from '@/lib/staffAuth';

export type UserRole = StaffRole;

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
}

interface LoginResult {
  success: boolean;
  error?: string;
  role?: StaffRole;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchStaffUser(supabaseUser: User): Promise<AuthUser> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', supabaseUser.id)
    .maybeSingle();

  if (error) {
    throw new Error('We could not verify your staff access. Please try again.');
  }

  if (!data || !isStaffRole(data.role)) {
    throw new Error('This account does not have staff access. Contact an administrator.');
  }

  return {
    id: supabaseUser.id,
    name: supabaseUser.email?.split('@')[0] || 'Staff',
    email: supabaseUser.email || '',
    role: data.role,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const requestId = useRef(0);

  const resolveSession = useCallback(async (nextSession: Session | null) => {
    const currentRequest = ++requestId.current;

    if (!nextSession?.user) {
      setSession(null);
      setUser(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const staffUser = await fetchStaffUser(nextSession.user);
      if (currentRequest !== requestId.current) return;

      setSession(nextSession);
      setUser(staffUser);
    } catch {
      if (currentRequest !== requestId.current) return;

      setSession(null);
      setUser(null);
      await supabase.auth.signOut();
    } finally {
      if (currentRequest === requestId.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      void resolveSession(initialSession);
    });

    // Do not await Supabase calls inside this callback; defer them to avoid deadlocks.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setTimeout(() => {
        void resolveSession(nextSession);
      }, 0);
    });

    return () => subscription.unsubscribe();
  }, [resolveSession]);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        return { success: false, error: error.message };
      }

      const staffUser = await fetchStaffUser(data.user);
      return { success: true, role: staffUser.role };
    } catch (error) {
      await supabase.auth.signOut();
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Staff sign-in failed. Please try again.',
      };
    }
  };

  const logout = async () => {
    requestId.current += 1;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      login,
      logout,
      isAuthenticated: !!session && !!user,
      isLoading,
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
