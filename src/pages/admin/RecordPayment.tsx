import { useState } from 'react';
import { CreditCard, Search, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLoans, LoanWithClient } from '@/hooks/useLoans';
import { useCreateRepayment, PaymentMethod } from '@/hooks/useRepayments';

export default function RecordPayment() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<LoanWithClient | null>(null);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');

  const { data: loans, isLoading } = useLoans(['active', 'overdue', 'disbursed']);
  const createRepayment = useCreateRepayment();

  const filteredLoans = (loans || []).filter(loan => {
    const clientName = `${loan.clients?.first_name || ''} ${loan.clients?.last_name || ''}`.toLowerCase();
    return clientName.includes(searchQuery.toLowerCase()) ||
      loan.loan_number.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatCurrency = (amount: number) => 
    `K${amount.toLocaleString()}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedLoan || !amount || !paymentMethod) return;

    try {
      await createRepayment.mutateAsync({
        loan_id: selectedLoan.id,
        amount: parseFloat(amount),
        payment_method: paymentMethod,
      });

      toast({
        title: 'Payment Recorded',
        description: `Payment of ${formatCurrency(parseFloat(amount))} has been recorded for loan ${selectedLoan.loan_number}.`,
      });

      setSelectedLoan(null);
      setAmount('');
      setPaymentMethod('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to record payment. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Record Payment</h1>
        <p className="mt-1 text-sm sm:text-base text-muted-foreground">
          Record a loan repayment from a client
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Search & Select Loan */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4">
          <h2 className="font-semibold">Select Loan</h2>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by client name or loan ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 sm:h-10"
            />
          </div>

          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {filteredLoans.map(loan => (
              <button
                key={loan.id}
                type="button"
                onClick={() => setSelectedLoan(loan)}
                className={`w-full flex flex-col gap-2 rounded-lg border p-3 sm:p-4 text-left transition-colors sm:flex-row sm:items-center sm:justify-between ${
                  selectedLoan?.id === loan.id 
                    ? 'border-accent bg-accent/5' 
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {loan.clients?.first_name} {loan.clients?.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {loan.loan_number} · {loan.loan_products?.name || 'Loan'}
                  </p>
                </div>
                <div className="flex items-center justify-between sm:flex-col sm:text-right sm:items-end">
                  <p className="font-medium">{formatCurrency(Number(loan.outstanding_balance))}</p>
                  <p className={`text-sm ${loan.status === 'overdue' ? 'text-destructive' : 'text-muted-foreground'}`}>
                    Outstanding
                  </p>
                </div>
              </button>
            ))}
            {filteredLoans.length === 0 && (
              <p className="text-center py-4 text-muted-foreground">
                No active loans found
              </p>
            )}
          </div>
        </div>

        {/* Payment Details */}
        {selectedLoan && (
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4 animate-fade-in">
            <h2 className="font-semibold">Payment Details</h2>
            
            <div className="rounded-lg bg-muted/50 p-3 sm:p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Outstanding Balance</span>
                <span className="font-medium">{formatCurrency(Number(selectedLoan.outstanding_balance))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Monthly Payment</span>
                <span className="font-medium">{formatCurrency(Number(selectedLoan.monthly_payment))}</span>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Payment Amount (K)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  max={Number(selectedLoan.outstanding_balance)}
                  className="h-11 sm:h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="method">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={(v: PaymentMethod) => setPaymentMethod(v)}>
                  <SelectTrigger className="h-11 sm:h-10">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quick amount buttons */}
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                className="h-10 sm:h-9 justify-start sm:justify-center"
                onClick={() => setAmount(selectedLoan.monthly_payment.toString())}
              >
                Monthly Payment ({formatCurrency(Number(selectedLoan.monthly_payment))})
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                className="h-10 sm:h-9 justify-start sm:justify-center"
                onClick={() => setAmount(selectedLoan.outstanding_balance.toString())}
              >
                Full Balance ({formatCurrency(Number(selectedLoan.outstanding_balance))})
              </Button>
            </div>
          </div>
        )}

        {/* Submit */}
        <Button 
          type="submit" 
          variant="accent" 
          size="lg" 
          className="w-full h-12 sm:h-11 text-base"
          disabled={!selectedLoan || !amount || !paymentMethod || createRepayment.isPending}
        >
          {createRepayment.isPending ? (
            'Recording Payment...'
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Record Payment
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
