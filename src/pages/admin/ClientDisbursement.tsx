import { useState } from 'react';
import { Check, AlertCircle, Eye, DollarSign, Send, Loader2 } from 'lucide-react';

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
import { ReceiptUpload } from '@/components/admin/ReceiptUpload';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { sendNotification } from '@/hooks/useNotifications';

export default function ClientDisbursement() {
  const { data: applications, isLoading } = useLoans('approved');
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

  const handleConfirmApprovalFee = async (app: LoanWithDetails) => {
    try {
      await recordFee.mutateAsync({
        loanId: app.id,
        feeType: 'approval_fee',
        amount: Number(app.loan_products?.approval_fee || 0),
        paymentMethod,
      });
      toast({
        title: 'Approval Fee Confirmed',
        description: 'The approval fee payment has been recorded',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to record fee',
        variant: 'destructive',
      });
    }
  };

  const handleDisburse = async (app: LoanWithDetails) => {
    try {
      await updateLoan.mutateAsync({
        id: app.id,
        status: 'disbursed',
        disbursed_at: new Date().toISOString(),
      });
      setShowDetails(false);
      setSelectedApp(null);
      toast({
        title: 'Loan Disbursed',
        description: 'The loan has been successfully disbursed to the client',
      });
      
      // Send disbursement notification email
      if (app.clients) {
        sendNotification(
          'loan_disbursed',
          app.clients.email,
          `${app.clients.first_name} ${app.clients.last_name}`,
          { 
            loanNumber: app.loan_number,
            loanAmount: Number(app.principal_amount)
          }
        );
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to disburse',
        variant: 'destructive',
      });
    }
  };

  const totalPendingDisbursement = applications?.reduce((sum, a) => sum + Number(a.principal_amount), 0) || 0;

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
      key: 'term',
      header: 'Term',
      cell: (app: LoanWithDetails) => `${app.term_months} months`,
      hideOnMobile: true,
    },
    {
      key: 'approvalFee',
      header: 'Approval Fee',
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
          <ActionButtons 
            app={app} 
            onConfirmFee={() => handleConfirmApprovalFee(app)}
            onDisburse={() => handleDisburse(app)}
          />
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Client Disbursement</h1>
        <p className="mt-1 text-muted-foreground">
          Confirm approval fees and disburse approved loans
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Disbursement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{applications?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalPendingDisbursement)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ready to Disburse
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
        emptyMessage="No approved loans pending disbursement"
      />

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Disbursement Details</DialogTitle>
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

              {/* Fee Statuses */}
              <FeeStatusDetail 
                loanId={selectedApp.id} 
                appFee={Number(selectedApp.loan_products?.application_fee || 0)}
                approvalFee={Number(selectedApp.loan_products?.approval_fee || 0)}
              />

              {/* Receipt Upload for Approval Fee */}
              <ApprovalFeeSection
                app={selectedApp}
                paymentMethod={paymentMethod}
                onPaymentMethodChange={(v) => setPaymentMethod(v as PaymentMethod)}
              />
            </div>
          )}
          <DialogFooter>
            <DisbursementActions 
              app={selectedApp}
              onConfirmFee={() => selectedApp && handleConfirmApprovalFee(selectedApp)}
              onDisburse={() => selectedApp && handleDisburse(selectedApp)}
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
      feeStatus?.approvalFeePaid ? 'text-success' : 'text-warning'
    )}>
      {feeStatus?.approvalFeePaid ? (
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

// Action buttons component
function ActionButtons({ 
  app, 
  onConfirmFee,
  onDisburse 
}: { 
  app: LoanWithDetails; 
  onConfirmFee: () => void;
  onDisburse: () => void;
}) {
  const { data: feeStatus } = useLoanFeeStatus(app.id);
  
  if (!feeStatus?.approvalFeePaid) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={onConfirmFee}
      >
        <DollarSign className="h-4 w-4 mr-1" />
        Confirm Fee
      </Button>
    );
  }
  
  return (
    <Button
      size="sm"
      onClick={onDisburse}
    >
      <Send className="h-4 w-4 mr-1" />
      Disburse
    </Button>
  );
}

// Component for fee status detail in dialog
function FeeStatusDetail({ loanId, appFee, approvalFee }: { loanId: string; appFee: number; approvalFee: number }) {
  const { data: feeStatus } = useLoanFeeStatus(loanId);
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between p-3 rounded-lg bg-success/10">
        <div className="flex items-center gap-2">
          <Check className="h-5 w-5 text-success" />
          <span className="text-success">Application Fee: K{appFee.toLocaleString()}</span>
        </div>
      </div>
      
      <div className={cn(
        'flex items-center justify-between p-3 rounded-lg',
        feeStatus?.approvalFeePaid ? 'bg-success/10' : 'bg-warning/10'
      )}>
        <div className="flex items-center gap-2">
          {feeStatus?.approvalFeePaid ? (
            <Check className="h-5 w-5 text-success" />
          ) : (
            <AlertCircle className="h-5 w-5 text-warning" />
          )}
          <span className={feeStatus?.approvalFeePaid ? 'text-success' : 'text-warning'}>
            Approval Fee: K{approvalFee.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

// Approval Fee Section with payment method and receipt upload
function ApprovalFeeSection({
  app,
  paymentMethod,
  onPaymentMethodChange,
}: {
  app: LoanWithDetails;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (value: string) => void;
}) {
  const { data: feeStatus } = useLoanFeeStatus(app.id);
  
  if (feeStatus?.approvalFeePaid) return null;
  
  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h4 className="font-medium">Confirm Approval Fee</h4>
      
      <div className="space-y-2">
        <Label>Payment Method</Label>
        <Select value={paymentMethod} onValueChange={onPaymentMethodChange}>
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
      
      <ReceiptUpload
        loanId={app.id}
        feeType="approval_fee"
      />
    </div>
  );
}

// Disbursement action buttons
function DisbursementActions({ 
  app, 
  onConfirmFee, 
  onDisburse,
  isPending 
}: { 
  app: LoanWithDetails | null;
  onConfirmFee: () => void;
  onDisburse: () => void;
  isPending: boolean;
}) {
  const { data: feeStatus } = useLoanFeeStatus(app?.id);
  
  if (!app) return null;
  
  return (
    <>
      {!feeStatus?.approvalFeePaid && (
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
        disabled={!feeStatus?.approvalFeePaid || isPending}
        onClick={onDisburse}
      >
        <Send className="h-4 w-4 mr-1" />
        Disburse Loan
      </Button>
    </>
  );
}
