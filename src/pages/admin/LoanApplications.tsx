import { useState } from 'react';
import { Check, X, DollarSign, Send, AlertCircle } from 'lucide-react';

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
import { useLoans, useUpdateLoan, LoanWithDetails } from '@/hooks/useLoans';
import { useCreateFeePayment, useFeePayments } from '@/hooks/useFeePayments';
import { cn } from '@/lib/utils';

type ActionType = 'approve' | 'reject' | 'confirmAppFee' | 'confirmApprovalFee' | 'disburse' | null;

export default function LoanApplications() {
  const { toast } = useToast();
  const { data: allLoans = [], isLoading } = useLoans(['applied', 'approved']);
  const { data: feePayments = [] } = useFeePayments();
  const updateLoan = useUpdateLoan();
  const createFeePayment = useCreateFeePayment();
  
  const [selectedLoan, setSelectedLoan] = useState<LoanWithDetails | null>(null);
  const [actionType, setActionType] = useState<ActionType>(null);

  const formatCurrency = (amount: number) => 
    `K${amount.toLocaleString()}`;

  const formatDate = (date: string) => 
    new Date(date).toLocaleDateString('en-MW', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });

  const checkFeePaid = (loanId: string, feeType: 'application_fee' | 'approval_fee') => {
    return feePayments.some(fp => fp.loan_id === loanId && fp.fee_type === feeType);
  };

  const handleAction = (loan: LoanWithDetails, action: ActionType) => {
    setSelectedLoan(loan);
    setActionType(action);
  };

  const confirmAction = async () => {
    if (!selectedLoan || !actionType) return;

    try {
      switch (actionType) {
        case 'confirmAppFee':
          await createFeePayment.mutateAsync({
            loan_id: selectedLoan.id,
            fee_type: 'application_fee',
            amount: Number(selectedLoan.loan_products.application_fee),
            payment_method: 'cash',
          });
          toast({ title: 'Application Fee Confirmed', description: `Application fee for ${selectedLoan.loan_number} has been recorded.` });
          break;
          
        case 'approve':
          await updateLoan.mutateAsync({
            id: selectedLoan.id,
            status: 'approved',
            approved_at: new Date().toISOString(),
          });
          toast({ title: 'Application Approved', description: `Loan ${selectedLoan.loan_number} has been approved.` });
          break;
          
        case 'reject':
          await updateLoan.mutateAsync({
            id: selectedLoan.id,
            status: 'rejected',
          });
          toast({ title: 'Application Rejected', description: `Loan ${selectedLoan.loan_number} has been rejected.` });
          break;
          
        case 'confirmApprovalFee':
          await createFeePayment.mutateAsync({
            loan_id: selectedLoan.id,
            fee_type: 'approval_fee',
            amount: Number(selectedLoan.loan_products.approval_fee),
            payment_method: 'cash',
          });
          toast({ title: 'Approval Fee Confirmed', description: `Approval fee for ${selectedLoan.loan_number} has been recorded.` });
          break;
          
        case 'disburse':
          await updateLoan.mutateAsync({
            id: selectedLoan.id,
            status: 'active',
            disbursed_at: new Date().toISOString(),
            next_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          });
          toast({ title: 'Loan Disbursed', description: `Loan ${selectedLoan.loan_number} has been disbursed.` });
          break;
      }
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message || 'Operation failed',
        variant: 'destructive',
      });
    }

    setSelectedLoan(null);
    setActionType(null);
  };

  const getActionButtons = (loan: LoanWithDetails) => {
    const appFeePaid = checkFeePaid(loan.id, 'application_fee');
    const approvalFeePaid = checkFeePaid(loan.id, 'approval_fee');

    if (loan.status === 'applied') {
      if (!appFeePaid) {
        return (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleAction(loan, 'confirmAppFee')}
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
            onClick={() => handleAction(loan, 'approve')}
          >
            <Check className="h-4 w-4 mr-1" />
            Approve
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => handleAction(loan, 'reject')}
          >
            <X className="h-4 w-4 mr-1" />
            Reject
          </Button>
        </>
      );
    }

    if (loan.status === 'approved') {
      if (!approvalFeePaid) {
        return (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleAction(loan, 'confirmApprovalFee')}
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
          onClick={() => handleAction(loan, 'disburse')}
        >
          <Send className="h-4 w-4 mr-1" />
          Disburse
        </Button>
      );
    }

    return null;
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
      cell: (loan: LoanWithDetails) => (
        <span className="font-medium">{loan.loan_number}</span>
      ),
    },
    {
      key: 'client',
      header: 'Client',
      cell: (loan: LoanWithDetails) => (
        <div>
          <p className="font-medium">{loan.clients.first_name} {loan.clients.last_name}</p>
          <p className="text-sm text-muted-foreground">{loan.clients.client_number}</p>
        </div>
      ),
    },
    {
      key: 'product',
      header: 'Product',
      cell: (loan: LoanWithDetails) => loan.loan_products.name,
    },
    {
      key: 'amount',
      header: 'Amount',
      cell: (loan: LoanWithDetails) => formatCurrency(Number(loan.principal_amount)),
    },
    {
      key: 'fees',
      header: 'Fee Status',
      cell: (loan: LoanWithDetails) => (
        <div className="flex flex-col gap-1">
          <FeeStatusIndicator 
            paid={checkFeePaid(loan.id, 'application_fee')} 
            label="App" 
            amount={Number(loan.loan_products.application_fee)} 
          />
          <FeeStatusIndicator 
            paid={checkFeePaid(loan.id, 'approval_fee')} 
            label="Approval" 
            amount={Number(loan.loan_products.approval_fee)} 
          />
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Applied',
      cell: (loan: LoanWithDetails) => formatDate(loan.applied_at),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (loan: LoanWithDetails) => <StatusBadge status={loan.status} />,
    },
    {
      key: 'actions',
      header: '',
      cell: (loan: LoanWithDetails) => (
        <div className="flex items-center gap-2">
          {getActionButtons(loan)}
        </div>
      ),
    },
  ];

  const pendingCount = allLoans.filter(l => l.status === 'applied').length;
  const awaitingFees = allLoans.filter(l => 
    (l.status === 'applied' && !checkFeePaid(l.id, 'application_fee')) || 
    (l.status === 'approved' && !checkFeePaid(l.id, 'approval_fee'))
  ).length;

  const getDialogContent = () => {
    if (!selectedLoan || !actionType) return null;

    const titles: Record<string, string> = {
      confirmAppFee: 'Confirm Application Fee Payment',
      approve: 'Approve Application',
      reject: 'Reject Application',
      confirmApprovalFee: 'Confirm Approval Fee Payment',
      disburse: 'Disburse Loan',
    };

    const descriptions: Record<string, string> = {
      confirmAppFee: `Confirm that the application fee of ${formatCurrency(Number(selectedLoan.loan_products.application_fee))} has been paid.`,
      approve: 'Are you sure you want to approve this loan application?',
      reject: 'Are you sure you want to reject this loan application?',
      confirmApprovalFee: `Confirm that the approval fee of ${formatCurrency(Number(selectedLoan.loan_products.approval_fee))} has been paid.`,
      disburse: `Are you sure you want to disburse ${formatCurrency(Number(selectedLoan.principal_amount))}?`,
    };

    return { title: titles[actionType], description: descriptions[actionType] };
  };

  const dialogContent = getDialogContent();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
        data={allLoans}
        emptyMessage="No loan applications"
      />

      {/* Confirmation Dialog */}
      <Dialog open={!!selectedLoan && !!actionType} onOpenChange={() => { setSelectedLoan(null); setActionType(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogContent?.title}</DialogTitle>
          </DialogHeader>
          {selectedLoan && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Client</span>
                  <span className="font-medium">{selectedLoan.clients.first_name} {selectedLoan.clients.last_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium">{formatCurrency(Number(selectedLoan.principal_amount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Product</span>
                  <span className="font-medium">{selectedLoan.loan_products.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Term</span>
                  <span className="font-medium">{selectedLoan.term_months} months</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {dialogContent?.description}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelectedLoan(null); setActionType(null); }}>
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
