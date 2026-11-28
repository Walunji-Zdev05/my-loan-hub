import { Navigate } from 'react-router-dom';
import { ClipboardCheck, LogOut, Wallet } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getStaffHome, getStaffRoleLabel, StaffRole } from '@/lib/staffAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface StaffWorkspaceProps {
  role: Exclude<StaffRole, 'admin'>;
}

export default function StaffWorkspace({ role }: StaffWorkspaceProps) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Verifying staff access...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== role) {
    return <Navigate to={getStaffHome(user.role)} replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Wallet className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-semibold">LoanPro</p>
              <p className="text-sm text-muted-foreground">{getStaffRoleLabel(role)} workspace</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => void logout()} className="min-h-11">
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
        <Card>
          <CardHeader>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <CardTitle>{getStaffRoleLabel(role)} dashboard</CardTitle>
            <CardDescription>
              You are signed in with {getStaffRoleLabel(role).toLowerCase()} access. Your role does not have access to the admin application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Signed in as {user.email}</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
