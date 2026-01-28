import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

interface DashboardLayoutProps {
  children: ReactNode;
  requiredRole?: 'borrower' | 'admin';
}

export function DashboardLayout({ children, requiredRole }: DashboardLayoutProps) {
  const { user, isAuthenticated, role } = useSupabaseAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to={`/${role}`} replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="ml-64 min-h-screen">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
