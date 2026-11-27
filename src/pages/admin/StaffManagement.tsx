import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, UserPlus } from 'lucide-react';

type StaffRole = 'admin' | 'approver' | 'loan_officer';

const roleLabels: Record<StaffRole, string> = {
  admin: 'Admin',
  approver: 'Approver',
  loan_officer: 'Loan Officer',
};

export default function StaffManagement() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<StaffRole>('loan_officer');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inviteStaff = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) {
      toast.error('Enter the staff member’s email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-staff', {
        body: { email: email.trim(), role },
      });

      if (error) {
        let message = 'The invitation could not be sent. Please try again.';
        try {
          const response = await (error as { context?: Response }).context;
          if (response) {
            const payload = await response.clone().json();
            if (typeof payload?.error === 'string') message = payload.error;
          }
        } catch {
          // Keep the safe fallback message if the response is not JSON.
        }
        throw new Error(message);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'The invitation could not be completed.');
      }

      toast.success(`Invitation sent to ${email.trim()}.`);
      setEmail('');
      setRole('loan_officer');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'The invitation could not be sent.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Staff Management</CardTitle>
            <CardDescription>Only Admins can invite staff members.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Staff Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Invite team members and assign their access role.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Invite a staff member</CardTitle>
              <CardDescription>
                They will receive an email invitation to set up their account.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={inviteStaff} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="staff-email">Email address</Label>
              <Input
                id="staff-email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                maxLength={254}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff-role">Staff role</Label>
              <Select value={role} onValueChange={(value: StaffRole) => setRole(value)}>
                <SelectTrigger id="staff-role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(roleLabels) as StaffRole[]).map((staffRole) => (
                    <SelectItem key={staffRole} value={staffRole}>
                      {roleLabels[staffRole]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
              Choose the least-privileged role needed for this staff member. Admin access should be limited to trusted system administrators.
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending invitation...</>
              ) : (
                <><UserPlus className="mr-2 h-4 w-4" /> Send invitation</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
