import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Phone, Mail, Plus, Eye, Loader2 } from 'lucide-react';

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

export default function ClientsList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  const { data: clients, isLoading } = useClients();

  const filteredClients = clients?.filter(client => {
    const fullName = `${client.first_name} ${client.last_name}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return (
      fullName.includes(query) ||
      client.client_number.toLowerCase().includes(query) ||
      (client.id_number?.toLowerCase().includes(query) ?? false)
    );
  }) || [];

  const formatDate = (date: string) => 
    new Date(date).toLocaleDateString('en-MW', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });

  const formatCurrency = (amount: number | null) => 
    amount ? `K${amount.toLocaleString()}` : 'N/A';

  const columns = [
    {
      key: 'client_number',
      header: 'Client ID',
      cell: (client: Client) => (
        <span className="font-medium font-mono text-sm">{client.client_number}</span>
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
      cell: (client: Client) => client.id_number || 'N/A',
      hideOnMobile: true,
    },
    {
      key: 'phone',
      header: 'Phone',
      cell: (client: Client) => client.phone || 'N/A',
      hideOnMobile: true,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (client: Client) => {
        const statusStyles: Record<string, string> = {
          pending: 'bg-warning/10 text-warning',
          approved: 'bg-success/10 text-success',
          active: 'bg-success/10 text-success',
          rejected: 'bg-destructive/10 text-destructive',
        };
        const style = statusStyles[client.status] || 'bg-muted text-muted-foreground';
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
            {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
          </span>
        );
      },
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
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
                  <h3 className="text-lg font-semibold">
                    {selectedClient.first_name} {selectedClient.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedClient.client_number} · NID: {selectedClient.id_number || 'N/A'}
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

              {/* Employment Info */}
              {(selectedClient.occupation || selectedClient.employer) && (
                <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                  <h4 className="font-medium">Employment</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {selectedClient.occupation && (
                      <div>
                        <span className="text-muted-foreground">Occupation:</span>
                        <p className="font-medium">{selectedClient.occupation}</p>
                      </div>
                    )}
                    {selectedClient.employer && (
                      <div>
                        <span className="text-muted-foreground">Employer:</span>
                        <p className="font-medium">{selectedClient.employer}</p>
                      </div>
                    )}
                    {selectedClient.monthly_income && (
                      <div>
                        <span className="text-muted-foreground">Monthly Income:</span>
                        <p className="font-medium">{formatCurrency(Number(selectedClient.monthly_income))}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
                  <p className="text-sm">{selectedClient.notes}</p>
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                Client since {formatDate(selectedClient.created_at)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
