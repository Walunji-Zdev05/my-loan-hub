import { useState } from 'react';
import { Check, X, Eye } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { loanApplications, LoanApplication, loanProducts } from '@/lib/mockData';

export default function LoanApplications() {
  const { toast } = useToast();
  const [applications, setApplications] = useState(loanApplications);
  const [selectedApp, setSelectedApp] = useState<LoanApplication | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-MW', { style: 'currency', currency: 'MWK' }).format(amount);

  const formatDate = (date: string) => 
    new Date(date).toLocaleDateString('en-MW', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });

  const handleAction = (app: LoanApplication, action: 'approve' | 'reject') => {
    setSelectedApp(app);
    setActionType(action);
  };

  const confirmAction = () => {
    if (!selectedApp || !actionType) return;

    setApplications(prev => 
      prev.map(app => 
        app.id === selectedApp.id 
          ? { ...app, status: actionType === 'approve' ? 'approved' : 'rejected' }
          : app
      )
    );

    toast({
      title: actionType === 'approve' ? 'Application Approved' : 'Application Rejected',
      description: `Loan application ${selectedApp.id} has been ${actionType === 'approve' ? 'approved' : 'rejected'}.`,
    });

    setSelectedApp(null);
    setActionType(null);
  };

  const getProductDetails = (productName: string) => 
    loanProducts.find(p => p.name === productName);

  const columns = [
    {
      key: 'id',
      header: 'Application ID',
      cell: (app: LoanApplication) => (
        <span className="font-medium">{app.id}</span>
      ),
    },
    {
      key: 'client',
      header: 'Client',
      cell: (app: LoanApplication) => (
        <div>
          <p className="font-medium">{app.clientName}</p>
          <p className="text-sm text-muted-foreground">NID: {app.nationalId}</p>
        </div>
      ),
    },
    {
      key: 'product',
      header: 'Product',
      cell: (app: LoanApplication) => app.product,
    },
    {
      key: 'amount',
      header: 'Amount',
      cell: (app: LoanApplication) => formatCurrency(app.amount),
    },
    {
      key: 'term',
      header: 'Term',
      cell: (app: LoanApplication) => `${app.term} ${app.termUnit}`,
    },
    {
      key: 'date',
      header: 'Applied',
      cell: (app: LoanApplication) => formatDate(app.appliedDate),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (app: LoanApplication) => <StatusBadge status={app.status} />,
    },
    {
      key: 'actions',
      header: '',
      cell: (app: LoanApplication) => (
        <div className="flex items-center gap-2">
          {app.status === 'pending' ? (
            <>
              <Button 
                variant="success" 
                size="sm"
                onClick={() => handleAction(app, 'approve')}
              >
                <Check className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => handleAction(app, 'reject')}
              >
                <X className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
          )}
        </div>
      ),
    },
  ];

  const pendingCount = applications.filter(a => a.status === 'pending').length;

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Loan Applications</h1>
            <p className="mt-1 text-muted-foreground">
              Review and process loan applications
            </p>
          </div>
          {pendingCount > 0 && (
            <div className="inline-flex items-center gap-2 rounded-full bg-warning/10 px-4 py-2 text-sm font-medium text-warning">
              {pendingCount} pending review
            </div>
          )}
        </div>

        <DataTable 
          columns={columns} 
          data={applications}
          emptyMessage="No loan applications"
        />

        {/* Confirmation Dialog */}
        <Dialog open={!!selectedApp && !!actionType} onOpenChange={() => { setSelectedApp(null); setActionType(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === 'approve' ? 'Approve Application' : 'Reject Application'}
              </DialogTitle>
            </DialogHeader>
            {selectedApp && (
              <div className="space-y-4">
                <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Client</span>
                    <span className="font-medium">{selectedApp.clientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-medium">{formatCurrency(selectedApp.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Product</span>
                    <span className="font-medium">{selectedApp.product}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Term</span>
                    <span className="font-medium">{selectedApp.term} {selectedApp.termUnit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Purpose</span>
                    <span className="font-medium text-right max-w-[200px]">{selectedApp.purpose}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {actionType === 'approve' 
                    ? 'Are you sure you want to approve this loan application? The loan will be ready for disbursement.'
                    : 'Are you sure you want to reject this loan application? The client will be notified.'
                  }
                </p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => { setSelectedApp(null); setActionType(null); }}>
                Cancel
              </Button>
              <Button 
                variant={actionType === 'approve' ? 'success' : 'destructive'}
                onClick={confirmAction}
              >
                {actionType === 'approve' ? 'Approve' : 'Reject'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
