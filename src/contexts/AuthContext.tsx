import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'borrower' | 'admin';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users
const demoUsers: Record<UserRole, User> = {
  borrower: {
    id: 'C001',
    name: 'John Mwangi',
    email: 'john@email.com',
    role: 'borrower',
  },
  admin: {
    id: 'A001',
    name: 'Admin User',
    email: 'admin@loanpro.com',
    role: 'admin',
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, password: string, role: UserRole): boolean => {
    // Demo login - in production, this would validate against a backend
    if (password.length >= 4) {
      setUser(demoUsers[role]);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
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
