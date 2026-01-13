import { useState } from 'react';
import { CreditCard, Search } from 'lucide-react';

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
import { loans, clients } from '@/lib/mockData';

export default function RecordPayment() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeLoans = loans.filter(l => l.status === 'active' || l.status === 'overdue');
  
  const filteredLoans = activeLoans.filter(loan => 
    loan.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loan.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedLoan = loans.find(l => l.id === selectedLoanId);

  const formatCurrency = (amount: number) => 
    `K${amount.toLocaleString()}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    await new Promise(resolve => setTimeout(resolve, 1000));

    toast({
      title: 'Payment Recorded',
      description: `Payment of ${formatCurrency(parseFloat(amount))} has been recorded for loan ${selectedLoanId}.`,
    });

    setSelectedLoanId('');
    setAmount('');
    setPaymentMethod('');
    setIsSubmitting(false);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Record Payment</h1>
        <p className="mt-1 text-muted-foreground">
          Record a loan repayment from a client
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Search & Select Loan */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-semibold">Select Loan</h2>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by client name or loan ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {filteredLoans.map(loan => (
              <button
                key={loan.id}
                type="button"
                onClick={() => setSelectedLoanId(loan.id)}
                className={`w-full flex items-center justify-between rounded-lg border p-4 text-left transition-colors ${
                  selectedLoanId === loan.id 
                    ? 'border-accent bg-accent/5' 
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <div>
                  <p className="font-medium">{loan.clientName}</p>
                  <p className="text-sm text-muted-foreground">
                    {loan.id} · {loan.product}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(loan.outstandingBalance)}</p>
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
          <div className="rounded-xl border border-border bg-card p-6 space-y-4 animate-fade-in">
            <h2 className="font-semibold">Payment Details</h2>
            
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Outstanding Balance</span>
                <span className="font-medium">{formatCurrency(selectedLoan.outstandingBalance)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Next Payment Due</span>
                <span className="font-medium">{formatCurrency(selectedLoan.nextPaymentAmount)}</span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Payment Amount (K)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  max={selectedLoan.outstandingBalance}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="method">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="mobile">Mobile Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quick amount buttons */}
            <div className="flex flex-wrap gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setAmount(selectedLoan.nextPaymentAmount.toString())}
              >
                Next Payment ({formatCurrency(selectedLoan.nextPaymentAmount)})
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setAmount(selectedLoan.outstandingBalance.toString())}
              >
                Full Balance ({formatCurrency(selectedLoan.outstandingBalance)})
              </Button>
            </div>
          </div>
        )}

        {/* Submit */}
        <Button 
          type="submit" 
          variant="accent" 
          size="lg" 
          className="w-full"
          disabled={!selectedLoanId || !amount || !paymentMethod || isSubmitting}
        >
          {isSubmitting ? (
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
