import { useState } from 'react';
import { Check, X, Eye, Loader2, UserCheck, UserX, Clock } from 'lucide-react';

import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useClientsByStatus, useUpdateClient, useClientStats, Client } from '@/hooks/useClients';
import { toast } from '@/hooks/use-toast';

export default function PendingClientsApproval() {
  const { data: pendingClients, isLoading } = useClientsByStatus('pending');
  const { data: stats } = useClientStats();
  const updateClient = useUpdateClient();
  
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-MW', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const formatCurrency = (amount: number | null) =>
    amount ? `K${amount.toLocaleString()}` : 'N/A';

  const handleApprove = async (client: Client) => {
    try {
      await updateClient.mutateAsync({
        id: client.id,
        status: 'approved',
      });
      setShowDetails(false);
      setSelectedClient(null);
      toast({
        title: 'Client Approved',
        description: `${client.first_name} ${client.last_name} is now approved and eligible for loans`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to approve client',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async () => {
    if (!selectedClient) return;
    
    try {
      await updateClient.mutateAsync({
        id: selectedClient.id,
        status: 'rejected',
        notes: rejectNotes ? `${selectedClient.notes ? selectedClient.notes + '\n\n' : ''}Rejection reason: ${rejectNotes}` : selectedClient.notes,
      });
      setShowRejectDialog(false);
      setShowDetails(false);
      setSelectedClient(null);
      setRejectNotes('');
      toast({
        title: 'Client Rejected',
        description: `${selectedClient.first_name} ${selectedClient.last_name} has been rejected`,
        variant: 'destructive',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reject client',
        variant: 'destructive',
      });
    }
  };

  const columns = [
    {
      key: 'client_number',
      header: 'Client ID',
      cell: (client: Client) => <span className="font-medium font-mono text-sm">{client.client_number}</span>,
    },
    {
      key: 'name',
      header: 'Name',
      cell: (client: Client) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning/10 text-warning text-sm font-medium">
            {client.first_name.charAt(0)}
          </div>
          <div>
            <p className="font-medium">{client.first_name} {client.last_name}</p>
            <p className="text-sm text-muted-foreground">NID: {client.id_number || 'N/A'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Contact',
      cell: (client: Client) => (
        <div>
          <p className="text-sm">{client.phone || 'No phone'}</p>
          <p className="text-xs text-muted-foreground">{client.email || 'No email'}</p>
        </div>
      ),
      hideOnMobile: true,
    },
    {
      key: 'income',
      header: 'Monthly Income',
      cell: (client: Client) => formatCurrency(client.monthly_income),
      hideOnMobile: true,
    },
    {
      key: 'created',
      header: 'Registered',
      cell: (client: Client) => formatDate(client.created_at),
      hideOnMobile: true,
    },
    {
      key: 'actions',
      header: '',
      cell: (client: Client) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedClient(client);
              setShowDetails(true);
            }}
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          <Button
            size="sm"
            onClick={() => handleApprove(client)}
            disabled={updateClient.isPending}
          >
            <Check className="h-4 w-4 mr-1" />
            Approve
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pending Client Approvals</h1>
        <p className="mt-1 text-muted-foreground">
          Review and approve new client registrations before they can apply for loans
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-warning">{stats?.pending || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Approved Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">{stats?.approved || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <UserX className="h-4 w-4" />
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{stats?.rejected || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Clients Table */}
      <DataTable
        columns={columns}
        data={pendingClients || []}
        emptyMessage="No pending client approvals"
      />

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Client Details</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-4">
              {/* Client Info */}
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-warning/10 text-warning text-xl font-semibold">
                  {selectedClient.first_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedClient.first_name} {selectedClient.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedClient.client_number} · NID: {selectedClient.id_number || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                <h4 className="font-medium">Contact Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Phone:</span>
                    <p className="font-medium">{selectedClient.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium">{selectedClient.email || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Employment Info */}
              <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                <h4 className="font-medium">Employment & Income</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Occupation:</span>
                    <p className="font-medium">{selectedClient.occupation || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Employer:</span>
                    <p className="font-medium">{selectedClient.employer || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Monthly Income:</span>
                    <p className="font-medium">{formatCurrency(selectedClient.monthly_income)}</p>
                  </div>
                </div>
              </div>

              {/* Address */}
              {selectedClient.address && (
                <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                  <h4 className="font-medium">Address</h4>
                  <p className="text-sm">{selectedClient.address}</p>
                </div>
              )}

              {/* Notes */}
              {selectedClient.notes && (
                <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                  <h4 className="font-medium">Notes</h4>
                  <p className="text-sm whitespace-pre-wrap">{selectedClient.notes}</p>
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                Registered on {formatDate(selectedClient.created_at)}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => setShowRejectDialog(true)}
              disabled={updateClient.isPending}
            >
              <X className="h-4 w-4 mr-1" />
              Reject
            </Button>
            <Button
              onClick={() => selectedClient && handleApprove(selectedClient)}
              disabled={updateClient.isPending}
            >
              <Check className="h-4 w-4 mr-1" />
              Approve Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to reject {selectedClient?.first_name} {selectedClient?.last_name}? 
              This client will not be able to apply for loans.
            </p>
            <div className="space-y-2">
              <Label htmlFor="reject_notes">Rejection Reason (Optional)</Label>
              <Textarea
                id="reject_notes"
                placeholder="Enter reason for rejection..."
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={updateClient.isPending}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
