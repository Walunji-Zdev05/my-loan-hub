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
import { useToast } from '@/hooks/use-toast';
import { useLoans, useUpdateLoan, LoanWithDetails } from '@/hooks/useLoans';
import { useFeePayments, useCreateFeePayment, useCreateLedgerEntry } from '@/hooks/usePayments';
import { cn } from '@/lib/utils';
import { Database } from '@/integrations/supabase/types';

type FeeType = Database['public']['Enums']['fee_type'];
type LoanStatus = Database['public']['Enums']['loan_status'];

export default function LoanApplications() {
  const { toast } = useToast();
  const [selectedApp, setSelectedApp] = useState<LoanWithDetails | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'confirmAppFee' | 'confirmApprovalFee' | 'disburse' | null>(null);

  const { data: applications = [], isLoading } = useLoans(['applied', 'approved']);
  const { data: allFeePayments = [] } = useFeePayments();
  const updateLoan = useUpdateLoan();
  const createFeePayment = useCreateFeePayment();
  const createLedgerEntry = useCreateLedgerEntry();

  const isProcessing = updateLoan.isPending || createFeePayment.isPending;

  const formatCurrency = (amount: number) => 
    `K${amount.toLocaleString()}`;

  const formatDate = (date: string) => 
    new Date(date).toLocaleDateString('en-MW', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });

  const getLoanFeePayments = (loanId: string) => 
    allFeePayments.filter(fp => fp.loan_id === loanId);

  const hasAppFeePaid = (loanId: string) => 
    getLoanFeePayments(loanId).some(fp => fp.fee_type === 'application_fee');

  const hasApprovalFeePaid = (loanId: string) => 
    getLoanFeePayments(loanId).some(fp => fp.fee_type === 'approval_fee');

  const handleAction = (app: LoanWithDetails, action: typeof actionType) => {
    setSelectedApp(app);
    setActionType(action);
  };

  const confirmAction = async () => {
    if (!selectedApp || !actionType) return;

    try {
      switch (actionType) {
        case 'confirmAppFee':
          const appFee = Number(selectedApp.loan_products?.application_fee || 0);
          await createFeePayment.mutateAsync({
            loan_id: selectedApp.id,
            fee_type: 'application_fee',
            amount: appFee,
            payment_method: 'cash',
          });
          await createLedgerEntry.mutateAsync({
            loan_id: selectedApp.id,
            client_id: selectedApp.client_id,
            entry_type: 'application_fee',
            amount: appFee,
            description: `Application fee for loan ${selectedApp.loan_number}`,
          });
          toast({ title: 'Application Fee Confirmed', description: `Application fee payment has been confirmed.` });
          break;

        case 'approve':
          await updateLoan.mutateAsync({
            id: selectedApp.id,
            status: 'approved',
            approved_at: new Date().toISOString(),
          });
          toast({ title: 'Application Approved', description: `Loan application has been approved.` });
          break;

        case 'reject':
          await updateLoan.mutateAsync({
            id: selectedApp.id,
            status: 'rejected',
          });
          toast({ title: 'Application Rejected', description: `Loan application has been rejected.` });
          break;

        case 'confirmApprovalFee':
          const approvalFee = Number(selectedApp.loan_products?.approval_fee || 0);
          await createFeePayment.mutateAsync({
            loan_id: selectedApp.id,
            fee_type: 'approval_fee',
            amount: approvalFee,
            payment_method: 'cash',
          });
          await createLedgerEntry.mutateAsync({
            loan_id: selectedApp.id,
            client_id: selectedApp.client_id,
            entry_type: 'approval_fee',
            amount: approvalFee,
            description: `Approval fee for loan ${selectedApp.loan_number}`,
          });
          toast({ title: 'Approval Fee Confirmed', description: `Approval fee payment has been confirmed.` });
          break;

        case 'disburse':
          await updateLoan.mutateAsync({
            id: selectedApp.id,
            status: 'active',
            disbursed_at: new Date().toISOString(),
            next_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          });
          toast({ title: 'Loan Disbursed', description: `Loan has been disbursed successfully.` });
          break;
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    }

    setSelectedApp(null);
    setActionType(null);
  };

  const getActionButtons = (app: LoanWithDetails) => {
    const appFeePaid = hasAppFeePaid(app.id);
    const approvalFeePaid = hasApprovalFeePaid(app.id);

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
      cell: (app: LoanWithDetails) => (
        <span className="font-medium">{app.loan_number}</span>
      ),
    },
    {
      key: 'client',
      header: 'Client',
      cell: (app: LoanWithDetails) => (
        <div>
          <p className="font-medium">{app.clients?.first_name} {app.clients?.last_name}</p>
          <p className="text-sm text-muted-foreground">{app.clients?.client_number}</p>
        </div>
      ),
    },
    {
      key: 'product',
      header: 'Product',
      cell: (app: LoanWithDetails) => app.loan_products?.name,
      hideOnMobile: true,
    },
    {
      key: 'amount',
      header: 'Amount',
      cell: (app: LoanWithDetails) => formatCurrency(Number(app.principal_amount)),
    },
    {
      key: 'fees',
      header: 'Fee Status',
      cell: (app: LoanWithDetails) => (
        <div className="flex flex-col gap-1">
          <FeeStatusIndicator 
            paid={hasAppFeePaid(app.id)} 
            label="App" 
            amount={Number(app.loan_products?.application_fee || 0)} 
          />
          <FeeStatusIndicator 
            paid={hasApprovalFeePaid(app.id)} 
            label="Approval" 
            amount={Number(app.loan_products?.approval_fee || 0)} 
          />
        </div>
      ),
      hideOnMobile: true,
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
      cell: (app: LoanWithDetails) => <StatusBadge status={app.status} />,
    },
    {
      key: 'actions',
      header: '',
      cell: (app: LoanWithDetails) => (
        <div className="flex items-center gap-2">
          {getActionButtons(app)}
        </div>
      ),
    },
  ];

  const pendingCount = applications.filter(a => a.status === 'applied').length;
  const awaitingFees = applications.filter(a => 
    (a.status === 'applied' && !hasAppFeePaid(a.id)) || 
    (a.status === 'approved' && !hasApprovalFeePaid(a.id))
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

    const appFee = Number(selectedApp.loan_products?.application_fee || 0);
    const approvalFee = Number(selectedApp.loan_products?.approval_fee || 0);

    const descriptions: Record<string, string> = {
      confirmAppFee: `Confirm that the application fee of ${formatCurrency(appFee)} has been paid by the client.`,
      approve: 'Are you sure you want to approve this loan application? The loan will await approval fee payment before disbursement.',
      reject: 'Are you sure you want to reject this loan application? The client will be notified.',
      confirmApprovalFee: `Confirm that the approval fee of ${formatCurrency(approvalFee)} has been paid by the client.`,
      disburse: `Are you sure you want to disburse ${formatCurrency(Number(selectedApp.principal_amount))} for this loan?`,
    };

    return { title: titles[actionType], description: descriptions[actionType] };
  };

  const dialogContent = getDialogContent();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
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
                  <div className="flex justify-between border-t border-border pt-3 mt-3">
                    <span className="text-muted-foreground font-medium">Fee Amount</span>
                    <span className="font-bold text-accent">
                      {formatCurrency(actionType === 'confirmAppFee' 
                        ? Number(selectedApp.loan_products?.application_fee || 0) 
                        : Number(selectedApp.loan_products?.approval_fee || 0)
                      )}
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
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
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
