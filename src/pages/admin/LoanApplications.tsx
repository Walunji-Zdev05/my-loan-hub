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
import { useToast } from '@/hooks/use-toast';
import { useLoans, useUpdateLoan, LoanWithClient } from '@/hooks/useLoans';
import { useFeePayments, useCreateFeePayment } from '@/hooks/useFeePayments';
import { cn } from '@/lib/utils';

type ActionType = 'approve' | 'reject' | 'confirmAppFee' | 'confirmApprovalFee' | 'disburse' | null;

export default function LoanApplications() {
  const { toast } = useToast();
  const [selectedApp, setSelectedApp] = useState<LoanWithClient | null>(null);
  const [actionType, setActionType] = useState<ActionType>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'mobile_money'>('cash');

  const { data: allLoans, isLoading } = useLoans();
  const { data: feePayments } = useFeePayments();
  const updateLoan = useUpdateLoan();
  const createFeePayment = useCreateFeePayment();

  // Filter to show only applications (applied, approved statuses)
  const applications = (allLoans || []).filter(l => 
    ['applied', 'approved'].includes(l.status)
  );

  const formatCurrency = (amount: number) => 
    `K${amount.toLocaleString()}`;

  const formatDate = (date: string) => 
    new Date(date).toLocaleDateString('en-MW', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });

  // Check if fee has been paid for a loan
  const hasPaidFee = (loanId: string, feeType: 'application_fee' | 'approval_fee') => {
    return (feePayments || []).some(fp => fp.loan_id === loanId && fp.fee_type === feeType);
  };

  const handleAction = (app: LoanWithClient, action: ActionType) => {
    setSelectedApp(app);
    setActionType(action);
  };

  const confirmAction = async () => {
    if (!selectedApp || !actionType) return;

    try {
      switch (actionType) {
        case 'confirmAppFee':
          await createFeePayment.mutateAsync({
            loan_id: selectedApp.id,
            fee_type: 'application_fee',
            amount: selectedApp.loan_products?.application_fee || 0,
            payment_method: paymentMethod,
          });
          toast({ title: 'Application Fee Confirmed', description: `Application fee payment has been recorded.` });
          break;
          
        case 'approve':
          await updateLoan.mutateAsync({ id: selectedApp.id, status: 'approved', approved_at: new Date().toISOString() });
          toast({ title: 'Application Approved', description: `Loan application has been approved.` });
          break;
          
        case 'reject':
          await updateLoan.mutateAsync({ id: selectedApp.id, status: 'rejected' });
          toast({ title: 'Application Rejected', description: `Loan application has been rejected.` });
          break;
          
        case 'confirmApprovalFee':
          await createFeePayment.mutateAsync({
            loan_id: selectedApp.id,
            fee_type: 'approval_fee',
            amount: selectedApp.loan_products?.approval_fee || 0,
            payment_method: paymentMethod,
          });
          toast({ title: 'Approval Fee Confirmed', description: `Approval fee payment has been recorded.` });
          break;
          
        case 'disburse':
          await updateLoan.mutateAsync({ 
            id: selectedApp.id, 
            status: 'active', 
            disbursed_at: new Date().toISOString(),
            next_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          });
          toast({ title: 'Loan Disbursed', description: `Loan has been disbursed.` });
          break;
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Action failed. Please try again.', variant: 'destructive' });
    }

    setSelectedApp(null);
    setActionType(null);
  };

  const getActionButtons = (app: LoanWithClient) => {
    const appFeePaid = hasPaidFee(app.id, 'application_fee');
    const approvalFeePaid = hasPaidFee(app.id, 'approval_fee');

    if (app.status === 'applied') {
      if (!appFeePaid) {
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

    if (app.status === 'approved') {
      if (!approvalFeePaid) {
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
      key: 'loan_number',
      header: 'Application ID',
      cell: (app: LoanWithClient) => (
        <span className="font-medium">{app.loan_number}</span>
      ),
    },
    {
      key: 'client',
      header: 'Client',
      cell: (app: LoanWithClient) => (
        <div>
          <p className="font-medium">{app.clients?.first_name} {app.clients?.last_name}</p>
          <p className="text-sm text-muted-foreground">{app.clients?.client_number}</p>
        </div>
      ),
    },
    {
      key: 'product',
      header: 'Product',
      cell: (app: LoanWithClient) => app.loan_products?.name || 'Unknown',
    },
    {
      key: 'amount',
      header: 'Amount',
      cell: (app: LoanWithClient) => formatCurrency(Number(app.principal_amount)),
    },
    {
      key: 'fees',
      header: 'Fee Status',
      cell: (app: LoanWithClient) => (
        <div className="flex flex-col gap-1">
          <FeeStatusIndicator 
            paid={hasPaidFee(app.id, 'application_fee')} 
            label="App" 
            amount={app.loan_products?.application_fee || 0} 
          />
          <FeeStatusIndicator 
            paid={hasPaidFee(app.id, 'approval_fee')} 
            label="Approval" 
            amount={app.loan_products?.approval_fee || 0} 
          />
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Applied',
      cell: (app: LoanWithClient) => formatDate(app.applied_at),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (app: LoanWithClient) => <StatusBadge status={app.status} />,
    },
    {
      key: 'actions',
      header: '',
      cell: (app: LoanWithClient) => (
        <div className="flex items-center gap-2">
          {getActionButtons(app)}
        </div>
      ),
    },
  ];

  const pendingCount = applications.filter(a => a.status === 'applied').length;
  const awaitingFees = applications.filter(a => 
    (a.status === 'applied' && !hasPaidFee(a.id, 'application_fee')) || 
    (a.status === 'approved' && !hasPaidFee(a.id, 'approval_fee'))
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
      confirmAppFee: `Confirm that the application fee of ${formatCurrency(selectedApp.loan_products?.application_fee || 0)} has been paid.`,
      approve: 'Are you sure you want to approve this loan application?',
      reject: 'Are you sure you want to reject this loan application?',
      confirmApprovalFee: `Confirm that the approval fee of ${formatCurrency(selectedApp.loan_products?.approval_fee || 0)} has been paid.`,
      disburse: `Are you sure you want to disburse ${formatCurrency(Number(selectedApp.principal_amount))}?`,
    };

    return { title: titles[actionType], description: descriptions[actionType] };
  };

  const dialogContent = getDialogContent();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
                {(actionType === 'confirmAppFee' || actionType === 'confirmApprovalFee') && (
                  <>
                    <div className="flex justify-between border-t border-border pt-3 mt-3">
                      <span className="text-muted-foreground font-medium">Fee Amount</span>
                      <span className="font-bold text-accent">
                        {formatCurrency(actionType === 'confirmAppFee' 
                          ? (selectedApp.loan_products?.application_fee || 0)
                          : (selectedApp.loan_products?.approval_fee || 0)
                        )}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Payment Method</label>
                      <Select value={paymentMethod} onValueChange={(v: 'cash' | 'bank_transfer' | 'mobile_money') => setPaymentMethod(v)}>
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
                  </>
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
              disabled={updateLoan.isPending || createFeePayment.isPending}
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
