import { useState } from 'react';
import { Check, AlertCircle, Eye, DollarSign, Loader2 } from 'lucide-react';

import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useLoans, useUpdateLoan, LoanWithDetails } from '@/hooks/useLoans';
import { useRecordFeePayment, useLoanFeeStatus, PaymentMethod } from '@/hooks/useFeePayments';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export default function ClientApproval() {
  const { data: applications, isLoading } = useLoans('applied');
  const updateLoan = useUpdateLoan();
  const recordFee = useRecordFeePayment();
  
  const [selectedApp, setSelectedApp] = useState<LoanWithDetails | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-MW', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const formatCurrency = (amount: number) =>
    `K${amount.toLocaleString()}`;

  const handleConfirmAppFee = async (app: LoanWithDetails) => {
    try {
      await recordFee.mutateAsync({
        loanId: app.id,
        feeType: 'application_fee',
        amount: Number(app.loan_products?.application_fee || 0),
        paymentMethod,
      });
      toast({
        title: 'Application Fee Confirmed',
        description: 'The application fee payment has been recorded',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to record fee',
        variant: 'destructive',
      });
    }
  };

  const handleApprove = async (appId: string) => {
    try {
      await updateLoan.mutateAsync({
        id: appId,
        status: 'approved',
        approved_at: new Date().toISOString(),
      });
      setShowDetails(false);
      setSelectedApp(null);
      toast({
        title: 'Application Approved',
        description: 'The client has been approved and moved to disbursement queue',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to approve',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (appId: string) => {
    try {
      await updateLoan.mutateAsync({
        id: appId,
        status: 'rejected',
      });
      setShowDetails(false);
      setSelectedApp(null);
      toast({
        title: 'Application Rejected',
        description: 'The application has been rejected',
        variant: 'destructive',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reject',
        variant: 'destructive',
      });
    }
  };

  const columns = [
    {
      key: 'loan_number',
      header: 'Loan ID',
      cell: (app: LoanWithDetails) => <span className="font-medium font-mono text-sm">{app.loan_number}</span>,
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
      key: 'amount',
      header: 'Loan Amount',
      cell: (app: LoanWithDetails) => (
        <div>
          <p className="font-medium">{formatCurrency(Number(app.principal_amount))}</p>
          <p className="text-sm text-muted-foreground">{app.loan_products?.name}</p>
        </div>
      ),
    },
    {
      key: 'appliedDate',
      header: 'Applied Date',
      cell: (app: LoanWithDetails) => formatDate(app.applied_at),
      hideOnMobile: true,
    },
    {
      key: 'appFee',
      header: 'Application Fee',
      cell: (app: LoanWithDetails) => <FeeStatus loanId={app.id} />,
    },
    {
      key: 'actions',
      header: '',
      cell: (app: LoanWithDetails) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedApp(app);
              setShowDetails(true);
            }}
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          <ConfirmFeeButton app={app} onConfirm={() => handleConfirmAppFee(app)} />
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

  const pendingCount = applications?.length || 0;
  const feesPending = applications?.length || 0; // Will be filtered by fee status in component

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Client Approval</h1>
        <p className="mt-1 text-muted-foreground">
          Review pending applications and confirm application fee payments
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fee Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-warning">{feesPending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ready to Approve
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">0</p>
          </CardContent>
        </Card>
      </div>

      {/* Applications Table */}
      <DataTable
        columns={columns}
        data={applications || []}
        emptyMessage="No pending applications"
      />

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-4">
              {/* Client Info */}
              <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                <h4 className="font-medium">Client Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <p className="font-medium">{selectedApp.clients?.first_name} {selectedApp.clients?.last_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">National ID:</span>
                    <p className="font-medium">{selectedApp.clients?.id_number || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Loan Details */}
              <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                <h4 className="font-medium">Loan Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Product:</span>
                    <p className="font-medium">{selectedApp.loan_products?.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Amount:</span>
                    <p className="font-medium">{formatCurrency(Number(selectedApp.principal_amount))}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Term:</span>
                    <p className="font-medium">{selectedApp.term_months} months</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Interest Rate:</span>
                    <p className="font-medium">{selectedApp.interest_rate}%</p>
                  </div>
                </div>
              </div>

              {/* Fee Status */}
              <FeeStatusDetail loanId={selectedApp.id} appFee={Number(selectedApp.loan_products?.application_fee || 0)} />

              {/* Payment Method Selection */}
              <div className="space-y-2">
                <Label>Payment Method (for fee confirmation)</Label>
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
            </div>
          )}
          <DialogFooter>
            <ApprovalActions 
              app={selectedApp}
              onConfirmFee={() => selectedApp && handleConfirmAppFee(selectedApp)}
              onApprove={() => selectedApp && handleApprove(selectedApp.id)}
              onReject={() => selectedApp && handleReject(selectedApp.id)}
              isPending={updateLoan.isPending || recordFee.isPending}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Component to show fee status
function FeeStatus({ loanId }: { loanId: string }) {
  const { data: feeStatus } = useLoanFeeStatus(loanId);
  
  return (
    <div className={cn(
      'flex items-center gap-2 text-sm',
      feeStatus?.applicationFeePaid ? 'text-success' : 'text-warning'
    )}>
      {feeStatus?.applicationFeePaid ? (
        <>
          <Check className="h-4 w-4" />
          <span>Paid</span>
        </>
      ) : (
        <>
          <AlertCircle className="h-4 w-4" />
          <span>Pending</span>
        </>
      )}
    </div>
  );
}

// Component to show confirm fee button only when needed
function ConfirmFeeButton({ app, onConfirm }: { app: LoanWithDetails; onConfirm: () => void }) {
  const { data: feeStatus } = useLoanFeeStatus(app.id);
  
  if (feeStatus?.applicationFeePaid) return null;
  
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={onConfirm}
    >
      <DollarSign className="h-4 w-4 mr-1" />
      Confirm Fee
    </Button>
  );
}

// Component for fee status detail in dialog
function FeeStatusDetail({ loanId, appFee }: { loanId: string; appFee: number }) {
  const { data: feeStatus } = useLoanFeeStatus(loanId);
  
  return (
    <div className={cn(
      'flex items-center justify-between p-4 rounded-lg',
      feeStatus?.applicationFeePaid ? 'bg-success/10' : 'bg-warning/10'
    )}>
      <div className="flex items-center gap-2">
        {feeStatus?.applicationFeePaid ? (
          <Check className="h-5 w-5 text-success" />
        ) : (
          <AlertCircle className="h-5 w-5 text-warning" />
        )}
        <span className={feeStatus?.applicationFeePaid ? 'text-success' : 'text-warning'}>
          Application Fee: K{appFee.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

// Approval action buttons
function ApprovalActions({ 
  app, 
  onConfirmFee, 
  onApprove, 
  onReject,
  isPending 
}: { 
  app: LoanWithDetails | null;
  onConfirmFee: () => void;
  onApprove: () => void;
  onReject: () => void;
  isPending: boolean;
}) {
  const { data: feeStatus } = useLoanFeeStatus(app?.id);
  
  if (!app) return null;
  
  return (
    <>
      {!feeStatus?.applicationFeePaid && (
        <Button
          variant="outline"
          onClick={onConfirmFee}
          disabled={isPending}
        >
          <DollarSign className="h-4 w-4 mr-1" />
          Confirm Fee Payment
        </Button>
      )}
      <Button
        variant="destructive"
        onClick={onReject}
        disabled={isPending}
      >
        Reject
      </Button>
      <Button
        disabled={!feeStatus?.applicationFeePaid || isPending}
        onClick={onApprove}
      >
        <Check className="h-4 w-4 mr-1" />
        Approve
      </Button>
    </>
  );
}
