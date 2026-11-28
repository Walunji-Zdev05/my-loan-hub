import { FormEvent, useCallback, useEffect, useState } from 'react';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { MailPlus, RefreshCw, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getStaffRoleLabel, StaffRole } from '@/lib/staffAuth';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type AccountStatus = 'active' | 'invited' | 'pending';

interface StaffRecord {
  id: string;
  email: string;
  role: StaffRole;
  status: AccountStatus;
  created_at: string | null;
  invited_at: string | null;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
}

interface StaffDirectoryResponse {
  staff: StaffRecord[];
}

async function functionErrorMessage(error: unknown, fallback: string): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json() as { error?: string };
      if (body.error) return body.error;
    } catch {
      // Use the standard error message when the response has no JSON body.
    }
  }

  return error instanceof Error ? error.message : fallback;
}

function formatTimestamp(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

function statusVariant(status: AccountStatus): 'default' | 'secondary' | 'outline' {
  if (status === 'active') return 'default';
  if (status === 'invited') return 'secondary';
  return 'outline';
}

export default function StaffManagement() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<StaffRole>('approver');
  const [staff, setStaff] = useState<StaffRecord[]>([]);
  const [isInviting, setIsInviting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [directoryError, setDirectoryError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadStaff = useCallback(async () => {
    setIsLoading(true);
    setDirectoryError(null);

    const { data, error } = await supabase.functions.invoke<StaffDirectoryResponse>('list-staff', {
      method: 'GET',
    });

    if (error) {
      setDirectoryError(await functionErrorMessage(error, 'Could not load the staff directory.'));
      setStaff([]);
    } else {
      setStaff(Array.isArray(data?.staff) ? data.staff : []);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadStaff();
  }, [loadStaff]);

  const handleInvite = async (event: FormEvent) => {
    event.preventDefault();
    setIsInviting(true);

    const { error } = await supabase.functions.invoke('invite-staff', {
      body: { email: email.trim(), role },
    });

    if (error) {
      toast({
        title: 'Invitation failed',
        description: await functionErrorMessage(error, 'The staff invitation could not be sent.'),
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Invitation sent',
        description: `${email.trim()} was invited as ${getStaffRoleLabel(role)}.`,
      });
      setEmail('');
      await loadStaff();
    }

    setIsInviting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Staff Management</h1>
        <p className="text-muted-foreground">Invite staff and review their assigned access.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MailPlus className="h-5 w-5" />
            Invite staff
          </CardTitle>
          <CardDescription>
            Send an email invitation with an Admin, Approver, or Loan Officer role. Borrowers are customers and do not receive sign-in access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-end">
            <div className="space-y-2">
              <Label htmlFor="staff-email">Email address</Label>
              <Input
                id="staff-email"
                type="email"
                autoComplete="off"
                placeholder="staff@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-role">Staff role</Label>
              <Select value={role} onValueChange={(value) => setRole(value as StaffRole)}>
                <SelectTrigger id="staff-role" className="h-11">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="approver">Approver</SelectItem>
                  <SelectItem value="loan_officer">Loan Officer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isInviting} className="min-h-11 w-full md:w-auto">
              {isInviting ? 'Sending invitation...' : 'Send invitation'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Staff directory
            </CardTitle>
            <CardDescription>Existing staff accounts and their current invitation status.</CardDescription>
          </div>
          <Button variant="outline" onClick={() => void loadStaff()} disabled={isLoading} className="min-h-11">
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {directoryError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Staff directory unavailable</AlertTitle>
              <AlertDescription className="space-y-3">
                <p>{directoryError}</p>
                <Button variant="outline" size="sm" onClick={() => void loadStaff()}>Try again</Button>
              </AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="space-y-3" aria-label="Loading staff directory">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : !directoryError && staff.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="font-medium">No staff accounts found</p>
              <p className="mt-1 text-sm text-muted-foreground">Invited staff will appear here.</p>
            </div>
          ) : !directoryError ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invited</TableHead>
                  <TableHead>Confirmed</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.email || '—'}</TableCell>
                    <TableCell>{getStaffRoleLabel(member.role)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(member.status)} className="capitalize">{member.status}</Badge>
                    </TableCell>
                    <TableCell>{formatTimestamp(member.invited_at)}</TableCell>
                    <TableCell>{formatTimestamp(member.email_confirmed_at)}</TableCell>
                    <TableCell>{formatTimestamp(member.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
