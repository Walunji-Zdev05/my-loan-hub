import { useState } from 'react';
import { Check, AlertCircle, Eye, DollarSign, Send, Loader2, FileText, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

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
import { useGenerateSchedule } from '@/hooks/useLoanSchedule';
import { ReceiptUpload } from '@/components/admin/ReceiptUpload';
import { RepaymentScheduleView } from '@/components/admin/RepaymentScheduleView';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { sendNotification } from '@/hooks/useNotifications';

export default function ClientDisbursement() {
  const { data: applications, isLoading } = useLoans('approved');
  const { data: disbursedLoans } = useLoans('disbursed');
  const updateLoan = useUpdateLoan();
  const recordFee = useRecordFeePayment();
  const generateSchedule = useGenerateSchedule();
  
  const [selectedApp, setSelectedApp] = useState<LoanWithDetails | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [scheduleViewLoan, setScheduleViewLoan] = useState<LoanWithDetails | null>(null);
  const [customFeeAmount, setCustomFeeAmount] = useState<string>('');
  const [customFeeDate, setCustomFeeDate] = useState<Date | undefined>(undefined);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-MW', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const formatCurrency = (amount: number) =>
    `K${amount.toLocaleString()}`;

  const handleConfirmApprovalFee = async (app: LoanWithDetails, overrideAmount?: number, overrideDate?: Date) => {
    try {
      const feeAmount = overrideAmount ?? Number(app.loan_products?.approval_fee || 0);
      await recordFee.mutateAsync({
        loanId: app.id,
        feeType: 'approval_fee',
        amount: feeAmount,
        paymentMethod,
        paidAt: overrideDate ? overrideDate.toISOString() : undefined,
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
      // First update loan status to disbursed
      await updateLoan.mutateAsync({
        id: app.id,
        status: 'disbursed',
        disbursed_at: new Date().toISOString(),
      });
      
      // Generate repayment schedule via Edge Function
      try {
        console.log('📅 Generating repayment schedule for loan:', app.id);
        const scheduleResult = await generateSchedule.mutateAsync(app.id);
        console.log('📅 Schedule generated:', scheduleResult);
        toast({
          title: 'Repayment Schedule Created',
          description: `Generated ${scheduleResult?.installments || app.term_months} installments`,
        });
      } catch (scheduleError) {
        console.error('Failed to generate schedule:', scheduleError);
        toast({
          title: 'Warning',
          description: 'Loan disbursed but schedule generation failed. Please retry.',
          variant: 'destructive',
        });
      }
      
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
  const readyToDisburseCount = applications?.filter(app => {
    // Count loans where approval fee is paid (we'll need to check this properly)
    return true; // Placeholder - the FeeStatus component handles the actual check
  }).length || 0;

  const columns = [
    {
      key: 'client_number',
      header: 'Client ID',
      cell: (app: LoanWithDetails) => (
        <span className="font-mono text-xs text-muted-foreground">{app.clients?.client_number}</span>
      ),
    },
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
                    <span className="text-muted-foreground">Client ID:</span>
                    <p className="font-mono font-medium">{selectedApp.clients?.client_number}</p>
                  </div>
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
                customAmount={customFeeAmount}
                onCustomAmountChange={setCustomFeeAmount}
                customDate={customFeeDate}
                onCustomDateChange={setCustomFeeDate}
              />
            </div>
          )}
          <DialogFooter>
            <DisbursementActions 
              app={selectedApp}
              onConfirmFee={() => {
                if (selectedApp) {
                  const amt = customFeeAmount ? Number(customFeeAmount) : undefined;
                  handleConfirmApprovalFee(selectedApp, amt, customFeeDate);
                }
              }}
              onDisburse={() => selectedApp && handleDisburse(selectedApp)}
              isPending={updateLoan.isPending || recordFee.isPending}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recently Disbursed Loans with Schedule View */}
      {disbursedLoans && disbursedLoans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recently Disbursed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {disbursedLoans.slice(0, 5).map((loan) => (
                <div
                  key={loan.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">
                      <span className="font-mono text-xs text-muted-foreground mr-2">{loan.clients?.client_number}</span>
                      {loan.clients?.first_name} {loan.clients?.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {loan.loan_number} • {formatCurrency(Number(loan.principal_amount))}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setScheduleViewLoan(loan)}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    View Schedule
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Repayment Schedule View Dialog */}
      {scheduleViewLoan && (
        <RepaymentScheduleView
          loanId={scheduleViewLoan.id}
          loanNumber={scheduleViewLoan.loan_number}
          clientId={scheduleViewLoan.clients?.client_number || 'N/A'}
          clientName={`${scheduleViewLoan.clients?.first_name || ''} ${scheduleViewLoan.clients?.last_name || ''}`}
          principalAmount={Number(scheduleViewLoan.principal_amount)}
          interestRate={scheduleViewLoan.interest_rate}
          termMonths={scheduleViewLoan.term_months}
          productName={scheduleViewLoan.loan_products?.name || 'N/A'}
          open={!!scheduleViewLoan}
          onOpenChange={(open) => !open && setScheduleViewLoan(null)}
        />
      )}
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
  customAmount,
  onCustomAmountChange,
  customDate,
  onCustomDateChange,
}: {
  app: LoanWithDetails;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (value: string) => void;
  customAmount: string;
  onCustomAmountChange: (value: string) => void;
  customDate: Date | undefined;
  onCustomDateChange: (date: Date | undefined) => void;
}) {
  const { data: feeStatus } = useLoanFeeStatus(app.id);
  const defaultFee = Number(app.loan_products?.approval_fee || 0);
  
  if (feeStatus?.approvalFeePaid) return null;
  
  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Confirm Approval Fee</h4>
        <span className="text-xs text-muted-foreground">
          Default: K{defaultFee.toLocaleString()}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Fee Amount</Label>
          <Input
            type="number"
            placeholder={defaultFee.toString()}
            value={customAmount}
            onChange={(e) => onCustomAmountChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Payment Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !customDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customDate ? format(customDate, "PPP") : "Today"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={customDate}
                onSelect={onCustomDateChange}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

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
