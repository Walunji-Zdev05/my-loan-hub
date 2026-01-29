import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Phone, Mail, Check, AlertCircle, Plus, Eye, Loader2 } from 'lucide-react';

import { DataTable } from '@/components/shared/DataTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useClients, Client } from '@/hooks/useClients';
import { useClientLoans } from '@/hooks/useLoans';
import { useFeePayments } from '@/hooks/useFeePayments';
import { cn } from '@/lib/utils';

export default function ClientsList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  const { data: clients, isLoading } = useClients();
  const { data: clientLoans } = useClientLoans(selectedClient?.id);
  const { data: feePayments } = useFeePayments();

  const filteredClients = (clients || []).filter(client => 
    `${client.first_name} ${client.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.client_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.id_number && client.id_number.includes(searchQuery))
  );

  const formatDate = (date: string) => 
    new Date(date).toLocaleDateString('en-MW', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });

  const formatCurrency = (amount: number) => 
    `K${amount.toLocaleString()}`;

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
      key: 'client_number',
      header: 'Client ID',
      cell: (client: Client) => (
        <span className="font-medium">{client.client_number}</span>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      cell: (client: Client) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
            {client.first_name.charAt(0)}
          </div>
          {client.first_name} {client.last_name}
        </div>
      ),
    },
    {
      key: 'id_number',
      header: 'National ID',
      cell: (client: Client) => client.id_number || '-',
    },
    {
      key: 'phone',
      header: 'Phone',
      cell: (client: Client) => client.phone || '-',
    },
    {
      key: 'status',
      header: 'Status',
      cell: (client: Client) => (
        <span className={cn(
          'px-2 py-0.5 rounded-full text-xs font-medium',
          client.status === 'active' && 'bg-success/10 text-success',
          client.status === 'pending' && 'bg-warning/10 text-warning',
          client.status === 'inactive' && 'bg-muted text-muted-foreground'
        )}>
          {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Clients</h1>
        <p className="mt-1 text-sm sm:text-base text-muted-foreground">
          Manage and view all registered clients
        </p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID, or national ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 sm:h-9"
          />
        </div>
        <Button onClick={() => navigate('/admin/clients/new')} className="h-10 sm:h-9 w-full sm:w-auto">
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
                  {selectedClient.first_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedClient.first_name} {selectedClient.last_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    ID: {selectedClient.client_number} · NID: {selectedClient.id_number || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid gap-3 rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedClient.email || 'No email'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedClient.phone || 'No phone'}</span>
                </div>
              </div>

              {/* Loans Summary */}
              <div>
                <h4 className="font-medium mb-3">Loan History</h4>
                <div className="space-y-2">
                  {!clientLoans || clientLoans.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No loan history</p>
                  ) : (
                    clientLoans.map(loan => (
                      <div 
                        key={loan.id}
                        className="flex items-center justify-between rounded-lg border border-border p-3"
                      >
                        <div>
                          <p className="font-medium">{loan.loan_products?.name || 'Loan'}</p>
                          <p className="text-sm text-muted-foreground">
                            {loan.loan_number} · {formatDate(loan.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(Number(loan.principal_amount))}</p>
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
  );
}
