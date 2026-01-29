import { useState } from 'react';
import { Check, X, Eye, DollarSign, Send, AlertCircle, Loader2 } from 'lucide-react';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLoans, useUpdateLoan, LoanWithDetails } from '@/hooks/useLoans';
import { useFeePayments, useRecordFeePayment, useLoanFeeStatus } from '@/hooks/useFeePayments';
import type { PaymentMethod } from '@/hooks/useFeePayments';
import { cn } from '@/lib/utils';

type ActionType = 'approve' | 'reject' | 'confirmAppFee' | 'confirmApprovalFee' | 'disburse' | null;

export default function LoanApplications() {
  const { toast } = useToast();
  const { data: applications, isLoading } = useLoans(['applied', 'approved']);
  const updateLoan = useUpdateLoan();
  const recordFee = useRecordFeePayment();
  
  const [selectedApp, setSelectedApp] = useState<LoanWithDetails | null>(null);
  const [actionType, setActionType] = useState<ActionType>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  
  const { data: feeStatus } = useLoanFeeStatus(selectedApp?.id);

  const formatCurrency = (amount: number) => 
    `K${amount.toLocaleString()}`;

  const formatDate = (date: string) => 
    new Date(date).toLocaleDateString('en-MW', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });

  const handleAction = (app: LoanWithDetails, action: ActionType) => {
    setSelectedApp(app);
    setActionType(action);
  };

  const confirmAction = async () => {
    if (!selectedApp || !actionType) return;

    try {
      switch (actionType) {
        case 'confirmAppFee':
          await recordFee.mutateAsync({
            loanId: selectedApp.id,
            feeType: 'application_fee',
            amount: Number(selectedApp.loan_products?.application_fee || 0),
            paymentMethod,
          });
          toast({ title: 'Application Fee Confirmed', description: 'The application fee has been recorded.' });
          break;
          
        case 'approve':
          await updateLoan.mutateAsync({
            id: selectedApp.id,
            status: 'approved',
            approved_at: new Date().toISOString(),
          });
          toast({ title: 'Application Approved', description: 'The loan application has been approved.' });
          break;
          
        case 'reject':
          await updateLoan.mutateAsync({
            id: selectedApp.id,
            status: 'rejected',
          });
          toast({ title: 'Application Rejected', description: 'The loan application has been rejected.' });
          break;
          
        case 'confirmApprovalFee':
          await recordFee.mutateAsync({
            loanId: selectedApp.id,
            feeType: 'approval_fee',
            amount: Number(selectedApp.loan_products?.approval_fee || 0),
            paymentMethod,
          });
          toast({ title: 'Approval Fee Confirmed', description: 'The approval fee has been recorded.' });
          break;
          
        case 'disburse':
          await updateLoan.mutateAsync({
            id: selectedApp.id,
            status: 'disbursed',
            disbursed_at: new Date().toISOString(),
          });
          toast({ title: 'Loan Disbursed', description: 'The loan has been disbursed.' });
          break;
      }
      
      setSelectedApp(null);
      setActionType(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Action failed',
        variant: 'destructive',
      });
    }
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
      key: 'loan_number',
      header: 'Loan ID',
      cell: (app: LoanWithDetails) => (
        <span className="font-medium font-mono text-sm">{app.loan_number}</span>
      ),
    },
    {
      key: 'client',
      header: 'Client',
      cell: (app: LoanWithDetails) => (
        <div>
          <p className="font-medium">{app.clients?.first_name} {app.clients?.last_name}</p>
          <p className="text-sm text-muted-foreground">NID: {app.clients?.id_number || 'N/A'}</p>
        </div>
      ),
    },
    {
      key: 'product',
      header: 'Product',
      cell: (app: LoanWithDetails) => app.loan_products?.name || 'N/A',
      hideOnMobile: true,
    },
    {
      key: 'amount',
      header: 'Amount',
      cell: (app: LoanWithDetails) => formatCurrency(Number(app.principal_amount)),
    },
    {
      key: 'date',
      header: 'Applied',
      cell: (app: LoanWithDetails) => formatDate(app.applied_at),
      hideOnMobile: true,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (app: LoanWithDetails) => <StatusBadge status={app.status as 'pending' | 'approved'} />,
    },
    {
      key: 'actions',
      header: '',
      cell: (app: LoanWithDetails) => <ActionButtons app={app} onAction={handleAction} />,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pendingCount = applications?.filter(a => a.status === 'applied').length || 0;

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
      confirmAppFee: `Confirm that the application fee of ${formatCurrency(Number(selectedApp.loan_products?.application_fee || 0))} has been paid.`,
      approve: 'Are you sure you want to approve this loan application?',
      reject: 'Are you sure you want to reject this loan application?',
      confirmApprovalFee: `Confirm that the approval fee of ${formatCurrency(Number(selectedApp.loan_products?.approval_fee || 0))} has been paid.`,
      disburse: `Are you sure you want to disburse ${formatCurrency(Number(selectedApp.principal_amount))} for this loan?`,
    };

    return { title: titles[actionType], description: descriptions[actionType] };
  };

  const dialogContent = getDialogContent();

  return (
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
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={applications || []}
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
                  <span className="font-medium">{selectedApp.clients?.first_name} {selectedApp.clients?.last_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium">{formatCurrency(Number(selectedApp.principal_amount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Product</span>
                  <span className="font-medium">{selectedApp.loan_products?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Term</span>
                  <span className="font-medium">{selectedApp.term_months} months</span>
                </div>
              </div>
              
              {(actionType === 'confirmAppFee' || actionType === 'confirmApprovalFee') && (
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
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
              disabled={updateLoan.isPending || recordFee.isPending}
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
  );
}

// Action buttons component that checks fee status
function ActionButtons({ 
  app, 
  onAction 
}: { 
  app: LoanWithDetails; 
  onAction: (app: LoanWithDetails, action: ActionType) => void;
}) {
  const { data: feeStatus } = useLoanFeeStatus(app.id);
  
  // Applied status: need to confirm application fee before approval
  if (app.status === 'applied') {
    if (!feeStatus?.applicationFeePaid) {
      return (
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onAction(app, 'confirmAppFee')}
          className="text-warning border-warning hover:bg-warning/10"
        >
          <DollarSign className="h-4 w-4 mr-1" />
          Confirm App Fee
        </Button>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <Button 
          variant="success" 
          size="sm"
          onClick={() => onAction(app, 'approve')}
        >
          <Check className="h-4 w-4 mr-1" />
          Approve
        </Button>
        <Button 
          variant="destructive" 
          size="sm"
          onClick={() => onAction(app, 'reject')}
        >
          <X className="h-4 w-4 mr-1" />
          Reject
        </Button>
      </div>
    );
  }

  // Approved status: need to confirm approval fee before disbursement
  if (app.status === 'approved') {
    if (!feeStatus?.approvalFeePaid) {
      return (
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onAction(app, 'confirmApprovalFee')}
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
        onClick={() => onAction(app, 'disburse')}
      >
        <Send className="h-4 w-4 mr-1" />
        Disburse
      </Button>
    );
  }

  return (
    <Button variant="ghost" size="sm">
      <Eye className="h-4 w-4 mr-1" />
      View
    </Button>
  );
}
