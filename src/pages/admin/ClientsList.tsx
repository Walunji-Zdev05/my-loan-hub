import { useState } from 'react';
import { Search, User, Phone, Mail } from 'lucide-react';
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
import { clients, loans, Client } from '@/lib/mockData';

export default function ClientsList() {
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
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setSelectedClient(client)}
        >
          View Details
        </Button>
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

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID, or national ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Clients Table */}
        <DataTable 
          columns={columns} 
          data={filteredClients}
          emptyMessage="No clients found"
        />

        {/* Client Details Modal */}
        <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
          <DialogContent className="max-w-lg">
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

                {/* Loans Summary */}
                <div>
                  <h4 className="font-medium mb-3">Loan History</h4>
                  <div className="space-y-2">
                    {getClientLoans(selectedClient.id).map(loan => (
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
                    ))}
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
