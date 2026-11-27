import { Navigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface StaffHomeProps {
  expectedRole: Extract<UserRole, 'approver' | 'loan_officer'>;
}

export default function StaffHome({ expectedRole }: StaffHomeProps) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Verifying staff access...</div>;
  }

  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  if (user.role !== expectedRole) {
    const destination = user.role === 'loan_officer' ? '/loan-officer' : user.role === 'approver' ? '/approver' : '/admin';
    return <Navigate to={destination} replace />;
  }

  const roleLabel = expectedRole === 'approver' ? 'Approver' : 'Loan Officer';

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <section className="w-full max-w-lg rounded-xl border bg-card p-8 text-center shadow-sm">
        <p className="text-sm font-medium text-primary">WaluTech LMS</p>
        <h1 className="mt-3 text-2xl font-semibold">{roleLabel} Workspace</h1>
        <p className="mt-3 text-muted-foreground">
          Signed in as {user.name}. Your role has been verified. This workspace is being configured;
          access to operational features will be added after the role permissions are implemented.
        </p>
        <Button className="mt-6" variant="outline" onClick={() => void logout()}>
          Sign out
        </Button>
      </section>
    </main>
  );
}
