import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Phone, Mail, Check, AlertCircle, Plus, Eye } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/shared/DataTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { clients, loans, loanApplications, Client } from '@/lib/mockData';
import { cn } from '@/lib/utils';

export default function ClientsList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.nationalId.includes(searchQuery)
  );

  const formatDate = (date: string) => 
    new Date(date).toLocaleDateString('en-MW', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-MW', { style: 'currency', currency: 'MWK' }).format(amount);

  const getClientLoans = (clientId: string) => 
    loans.filter(l => l.clientId === clientId);

  const getClientApplications = (clientId: string) =>
    loanApplications.filter(a => a.clientId === clientId);

  const FeeStatusBadge = ({ paid, label, amount, paidDate }: { paid: boolean; label: string; amount: number; paidDate?: string }) => (
    <div className={cn(
      'flex items-center justify-between p-2 rounded-lg text-sm',
      paid ? 'bg-success/10' : 'bg-muted'
    )}>
      <div className="flex items-center gap-2">
        {paid ? (
          <Check className="h-4 w-4 text-success" />
        ) : (
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        )}
        <span className={paid ? 'text-success' : 'text-muted-foreground'}>{label}</span>
      </div>
      <div className="text-right">
        <p className="font-medium">{formatCurrency(amount)}</p>
        {paidDate && <p className="text-xs text-muted-foreground">Paid: {formatDate(paidDate)}</p>}
      </div>
    </div>
  );

  const columns = [
    {
      key: 'id',
      header: 'Client ID',
      cell: (client: Client) => (
        <span className="font-medium">{client.id}</span>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      cell: (client: Client) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
            {client.name.charAt(0)}
          </div>
          {client.name}
        </div>
      ),
    },
    {
      key: 'nationalId',
      header: 'National ID',
      cell: (client: Client) => client.nationalId,
    },
    {
      key: 'phone',
      header: 'Phone',
      cell: (client: Client) => client.phone,
    },
    {
      key: 'totalLoans',
      header: 'Total Loans',
      cell: (client: Client) => client.totalLoans,
    },
    {
      key: 'activeLoans',
      header: 'Active',
      cell: (client: Client) => (
        <span className={client.activeLoans > 0 ? 'text-accent font-medium' : 'text-muted-foreground'}>
          {client.activeLoans}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (client: Client) => (
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setSelectedClient(client)}
          >
            Quick View
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate(`/admin/clients/${client.id}`)}
          >
            <Eye className="h-4 w-4 mr-1" />
            Full Profile
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="mt-1 text-muted-foreground">
            Manage and view all registered clients
          </p>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, or national ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => navigate('/admin/clients/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Client
          </Button>
        </div>

        {/* Clients Table */}
        <DataTable 
          columns={columns} 
          data={filteredClients}
          emptyMessage="No clients found"
        />

        {/* Client Details Modal */}
        <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Client Details</DialogTitle>
            </DialogHeader>
            {selectedClient && (
              <div className="space-y-6">
                {/* Client Info */}
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-semibold">
                    {selectedClient.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedClient.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      ID: {selectedClient.id} · NID: {selectedClient.nationalId}
                    </p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid gap-3 rounded-lg bg-muted/50 p-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedClient.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedClient.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Member since {formatDate(selectedClient.joinDate)}</span>
                  </div>
                </div>

                {/* Fee Status from Applications */}
                {getClientApplications(selectedClient.id).length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Application Fee Status</h4>
                    <div className="space-y-3">
                      {getClientApplications(selectedClient.id).map(app => (
                        <div key={app.id} className="border border-border rounded-lg p-3 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{app.id} - {app.product}</span>
                            <span className={cn(
                              'text-xs px-2 py-0.5 rounded-full',
                              app.status === 'pending' && 'bg-warning/10 text-warning',
                              app.status === 'approved' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
                              app.status === 'rejected' && 'bg-destructive/10 text-destructive',
                              app.status === 'disbursed' && 'bg-success/10 text-success'
                            )}>
                              {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">
                            Amount: {formatCurrency(app.amount)} · Applied: {formatDate(app.appliedDate)}
                          </div>
                          <div className="grid gap-2">
                            <FeeStatusBadge 
                              paid={app.applicationFeePaid} 
                              label="Application Fee" 
                              amount={app.applicationFeeAmount}
                              paidDate={app.applicationFeePaidDate}
                            />
                            <FeeStatusBadge 
                              paid={app.approvalFeePaid} 
                              label="Approval Fee" 
                              amount={app.approvalFeeAmount}
                              paidDate={app.approvalFeePaidDate}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Loans Summary */}
                <div>
                  <h4 className="font-medium mb-3">Loan History</h4>
                  <div className="space-y-2">
                    {getClientLoans(selectedClient.id).length === 0 ? (
                      <p className="text-sm text-muted-foreground">No loan history</p>
                    ) : (
                      getClientLoans(selectedClient.id).map(loan => (
                        <div 
                          key={loan.id}
                          className="flex items-center justify-between rounded-lg border border-border p-3"
                        >
                          <div>
                            <p className="font-medium">{loan.product}</p>
                            <p className="text-sm text-muted-foreground">
                              {loan.id} · {formatDate(loan.disbursedDate)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(loan.amount)}</p>
                            <p className={`text-sm ${
                              loan.status === 'paid' ? 'text-success' : 
                              loan.status === 'overdue' ? 'text-destructive' : 
                              'text-warning'
                            }`}>
                              {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
