import { useRef } from 'react';
import { Printer, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLoanSchedule, LoanScheduleWithDetails } from '@/hooks/useLoanSchedule';
import { Skeleton } from '@/components/ui/skeleton';

interface RepaymentScheduleViewProps {
  loanId: string;
  loanNumber: string;
  clientId: string;
  clientName: string;
  principalAmount: number;
  interestRate: number;
  termMonths: number;
  productName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RepaymentScheduleView({
  loanId,
  loanNumber,
  clientId,
  clientName,
  principalAmount,
  interestRate,
  termMonths,
  productName,
  open,
  onOpenChange,
}: RepaymentScheduleViewProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { data: schedule, isLoading } = useLoanSchedule(loanId);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-MW', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const formatCurrency = (amount: number) =>
    `K${amount.toLocaleString('en-MW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Calculate running balance
  const scheduleWithBalance = schedule?.map((entry, index) => {
    const paidPrincipal = schedule
      .slice(0, index + 1)
      .reduce((sum, e) => sum + Number(e.principal_portion), 0);
    const balanceRemaining = principalAmount - paidPrincipal;
    return { ...entry, balanceRemaining };
  }) || [];

  const totalPrincipal = schedule?.reduce((sum, e) => sum + Number(e.principal_portion), 0) || 0;
  const totalInterest = schedule?.reduce((sum, e) => sum + Number(e.interest_portion), 0) || 0;
  const totalAmount = schedule?.reduce((sum, e) => sum + Number(e.total_amount), 0) || 0;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Repayment Schedule - ${loanNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px;
              font-size: 12px;
            }
            .header { 
              text-align: center; 
              margin-bottom: 20px;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            .header h1 { font-size: 18px; margin-bottom: 5px; }
            .header p { color: #666; }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-bottom: 20px;
              padding: 10px;
              background: #f5f5f5;
              border-radius: 4px;
            }
            .info-item label { font-weight: bold; display: block; color: #666; font-size: 10px; }
            .info-item span { font-size: 12px; }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 10px;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 8px; 
              text-align: right;
            }
            th { 
              background: #333; 
              color: white;
              font-weight: bold;
            }
            th:first-child, td:first-child { text-align: center; }
            th:nth-child(2), td:nth-child(2) { text-align: left; }
            tr:nth-child(even) { background: #f9f9f9; }
            .totals { font-weight: bold; background: #e5e5e5 !important; }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
            }
            .signature-line {
              display: flex;
              justify-content: space-between;
              margin-top: 40px;
            }
            .signature-box {
              width: 200px;
              text-align: center;
            }
            .signature-box .line {
              border-top: 1px solid #333;
              margin-top: 40px;
              padding-top: 5px;
            }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Repayment Schedule</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <div ref={printRef}>
            {/* Header */}
            <div className="header text-center mb-6 pb-4 border-b-2 border-foreground">
              <h1 className="text-xl font-bold">LOAN REPAYMENT SCHEDULE</h1>
              <p className="text-muted-foreground text-sm">Generated on {formatDate(new Date().toISOString())}</p>
            </div>

            {/* Loan Info */}
            <div className="info-grid grid grid-cols-2 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
              <div className="info-item">
                <label className="text-xs text-muted-foreground font-semibold">Client ID</label>
                <span className="font-mono font-semibold">{clientId}</span>
              </div>
              <div className="info-item">
                <label className="text-xs text-muted-foreground font-semibold">Client Name</label>
                <span>{clientName}</span>
              </div>
              <div className="info-item">
                <label className="text-xs text-muted-foreground font-semibold">Loan Number</label>
                <span className="font-mono">{loanNumber}</span>
              </div>
              <div className="info-item">
                <label className="text-xs text-muted-foreground font-semibold">Loan Product</label>
                <span>{productName}</span>
              </div>
              <div className="info-item">
                <label className="text-xs text-muted-foreground font-semibold">Principal Amount</label>
                <span className="font-semibold">{formatCurrency(principalAmount)}</span>
              </div>
              <div className="info-item">
                <label className="text-xs text-muted-foreground font-semibold">Interest Rate</label>
                <span>{interestRate}% per month</span>
              </div>
              <div className="info-item">
                <label className="text-xs text-muted-foreground font-semibold">Term</label>
                <span>{termMonths} months</span>
              </div>
            </div>

            {/* Schedule Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 text-center">#</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Installment</TableHead>
                  <TableHead className="text-right">Principal</TableHead>
                  <TableHead className="text-right">Interest</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduleWithBalance.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-center font-mono">
                      {entry.installment_number}
                    </TableCell>
                    <TableCell>{formatDate(entry.due_date)}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(Number(entry.total_amount))}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(Number(entry.principal_portion))}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(Number(entry.interest_portion))}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(Math.max(0, entry.balanceRemaining))}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Totals Row */}
                <TableRow className="totals bg-muted font-bold">
                  <TableCell colSpan={2} className="text-right">
                    TOTAL
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(totalAmount)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(totalPrincipal)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(totalInterest)}
                  </TableCell>
                  <TableCell className="text-right font-mono">—</TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {/* Footer with Signature Lines */}
            <div className="footer mt-8 pt-6 border-t">
              <p className="text-sm text-muted-foreground mb-2">
                I acknowledge receipt of this repayment schedule and agree to make payments as outlined above.
              </p>
              <div className="signature-line flex justify-between mt-10">
                <div className="signature-box w-48 text-center">
                  <div className="line border-t border-foreground mt-10 pt-2">
                    Client Signature
                  </div>
                </div>
                <div className="signature-box w-48 text-center">
                  <div className="line border-t border-foreground mt-10 pt-2">
                    Date
                  </div>
                </div>
                <div className="signature-box w-48 text-center">
                  <div className="line border-t border-foreground mt-10 pt-2">
                    Officer Signature
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
