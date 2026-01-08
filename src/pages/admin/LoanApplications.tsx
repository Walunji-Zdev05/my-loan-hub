import { useState } from 'react';
import { Check, X, Eye, DollarSign, Send, AlertCircle } from 'lucide-react';
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
import { cn } from '@/lib/utils';

export default function LoanApplications() {
  const { toast } = useToast();
  const [applications, setApplications] = useState(loanApplications);
  const [selectedApp, setSelectedApp] = useState<LoanApplication | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'confirmAppFee' | 'confirmApprovalFee' | 'disburse' | null>(null);

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-MW', { style: 'currency', currency: 'MWK' }).format(amount);

  const formatDate = (date: string) => 
    new Date(date).toLocaleDateString('en-MW', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });

  const handleAction = (app: LoanApplication, action: typeof actionType) => {
    setSelectedApp(app);
    setActionType(action);
  };

  const confirmAction = () => {
    if (!selectedApp || !actionType) return;

    const today = new Date().toISOString().split('T')[0];

    setApplications(prev => 
      prev.map(app => {
        if (app.id !== selectedApp.id) return app;
        
        switch (actionType) {
          case 'confirmAppFee':
            return { ...app, applicationFeePaid: true, applicationFeePaidDate: today };
          case 'approve':
            return { ...app, status: 'approved' as const };
          case 'reject':
            return { ...app, status: 'rejected' as const };
          case 'confirmApprovalFee':
            return { ...app, approvalFeePaid: true, approvalFeePaidDate: today };
          case 'disburse':
            return { ...app, status: 'disbursed' as const };
          default:
            return app;
        }
      })
    );

    const messages: Record<string, { title: string; description: string }> = {
      confirmAppFee: { title: 'Application Fee Confirmed', description: `Application fee payment for ${selectedApp.id} has been confirmed.` },
      approve: { title: 'Application Approved', description: `Loan application ${selectedApp.id} has been approved.` },
      reject: { title: 'Application Rejected', description: `Loan application ${selectedApp.id} has been rejected.` },
      confirmApprovalFee: { title: 'Approval Fee Confirmed', description: `Approval fee payment for ${selectedApp.id} has been confirmed.` },
      disburse: { title: 'Loan Disbursed', description: `Loan for application ${selectedApp.id} has been disbursed.` },
    };

    toast(messages[actionType]);
    setSelectedApp(null);
    setActionType(null);
  };

  const getProductDetails = (productName: string) => 
    loanProducts.find(p => p.name === productName);

  const getActionButtons = (app: LoanApplication) => {
    // Pending status: need to confirm application fee before approval
    if (app.status === 'pending') {
      if (!app.applicationFeePaid) {
        return (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleAction(app, 'confirmAppFee')}
            className="text-warning border-warning hover:bg-warning/10"
          >
            <DollarSign className="h-4 w-4 mr-1" />
            Confirm App Fee
          </Button>
        );
      }
      return (
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
      );
    }

    // Approved status: need to confirm approval fee before disbursement
    if (app.status === 'approved') {
      if (!app.approvalFeePaid) {
        return (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleAction(app, 'confirmApprovalFee')}
            className="text-accent border-accent hover:bg-accent/10"
          >
            <DollarSign className="h-4 w-4 mr-1" />
            Confirm Approval Fee
          </Button>
        );
      }
      return (
        <Button 
          variant="accent" 
          size="sm"
          onClick={() => handleAction(app, 'disburse')}
        >
          <Send className="h-4 w-4 mr-1" />
          Disburse
        </Button>
      );
    }

    // Other statuses: just view
    return (
      <Button variant="ghost" size="sm">
        <Eye className="h-4 w-4 mr-1" />
        View
      </Button>
    );
  };

  const FeeStatusIndicator = ({ paid, label, amount }: { paid: boolean; label: string; amount: number }) => (
    <div className={cn(
      'flex items-center gap-2 text-xs px-2 py-1 rounded',
      paid ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
    )}>
      {paid ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
      {label}: {formatCurrency(amount)}
    </div>
  );

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
      key: 'fees',
      header: 'Fee Status',
      cell: (app: LoanApplication) => (
        <div className="flex flex-col gap-1">
          <FeeStatusIndicator 
            paid={app.applicationFeePaid} 
            label="App" 
            amount={app.applicationFeeAmount} 
          />
          <FeeStatusIndicator 
            paid={app.approvalFeePaid} 
            label="Approval" 
            amount={app.approvalFeeAmount} 
          />
        </div>
      ),
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
          {getActionButtons(app)}
        </div>
      ),
    },
  ];

  const pendingCount = applications.filter(a => a.status === 'pending').length;
  const awaitingFees = applications.filter(a => 
    (a.status === 'pending' && !a.applicationFeePaid) || 
    (a.status === 'approved' && !a.approvalFeePaid)
  ).length;

  const getDialogContent = () => {
    if (!selectedApp || !actionType) return null;

    const titles: Record<string, string> = {
      confirmAppFee: 'Confirm Application Fee Payment',
      approve: 'Approve Application',
      reject: 'Reject Application',
      confirmApprovalFee: 'Confirm Approval Fee Payment',
      disburse: 'Disburse Loan',
    };

    const descriptions: Record<string, string> = {
      confirmAppFee: `Confirm that the application fee of ${formatCurrency(selectedApp.applicationFeeAmount)} has been paid by the client.`,
      approve: 'Are you sure you want to approve this loan application? The loan will await approval fee payment before disbursement.',
      reject: 'Are you sure you want to reject this loan application? The client will be notified.',
      confirmApprovalFee: `Confirm that the approval fee of ${formatCurrency(selectedApp.approvalFeeAmount)} has been paid by the client.`,
      disburse: `Are you sure you want to disburse ${formatCurrency(selectedApp.amount)} for this loan?`,
    };

    return { title: titles[actionType], description: descriptions[actionType] };
  };

  const dialogContent = getDialogContent();

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
          <div className="flex gap-2">
            {pendingCount > 0 && (
              <div className="inline-flex items-center gap-2 rounded-full bg-warning/10 px-4 py-2 text-sm font-medium text-warning">
                {pendingCount} pending review
              </div>
            )}
            {awaitingFees > 0 && (
              <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-sm font-medium text-accent">
                {awaitingFees} awaiting fees
              </div>
            )}
          </div>
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
              <DialogTitle>{dialogContent?.title}</DialogTitle>
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
                  {(actionType === 'confirmAppFee' || actionType === 'confirmApprovalFee') && (
                    <div className="flex justify-between border-t border-border pt-3 mt-3">
                      <span className="text-muted-foreground font-medium">Fee Amount</span>
                      <span className="font-bold text-accent">
                        {formatCurrency(actionType === 'confirmAppFee' ? selectedApp.applicationFeeAmount : selectedApp.approvalFeeAmount)}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {dialogContent?.description}
                </p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => { setSelectedApp(null); setActionType(null); }}>
                Cancel
              </Button>
              <Button 
                variant={actionType === 'reject' ? 'destructive' : actionType === 'disburse' ? 'accent' : 'success'}
                onClick={confirmAction}
              >
                {actionType === 'confirmAppFee' && 'Confirm Payment'}
                {actionType === 'approve' && 'Approve'}
                {actionType === 'reject' && 'Reject'}
                {actionType === 'confirmApprovalFee' && 'Confirm Payment'}
                {actionType === 'disburse' && 'Disburse Loan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
