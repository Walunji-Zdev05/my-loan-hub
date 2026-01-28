import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, Send, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { loanProducts } from '@/lib/mockData';

export default function ApplyLoan() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    product: '',
    amount: '',
    term: '',
    purpose: '',
  });

  const activeProducts = loanProducts.filter(p => p.isActive);
  const selectedProduct = loanProducts.find(p => p.id === formData.product);

  const formatCurrency = (amount: number) => 
    `K${amount.toLocaleString()}`;

  // Calculate estimated payment
  const calculatePayment = () => {
    if (!selectedProduct || !formData.amount || !formData.term) return null;
    const principal = parseFloat(formData.amount);
    const term = parseInt(formData.term);
    const totalWithInterest = principal * (1 + selectedProduct.interestRate / 100);
    return totalWithInterest / term;
  };

  const estimatedPayment = calculatePayment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast({
      title: 'Application Submitted!',
      description: 'Your loan application has been submitted for review.',
    });

    setIsSubmitting(false);
    navigate('/borrower');
  };

  const isFormValid = formData.product && formData.amount && formData.term && formData.purpose;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Apply for a Loan</h1>
        <p className="mt-1 text-muted-foreground">
          Fill in the details below to submit your loan application
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Selection */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-semibold">Loan Product</h2>
          
          <div className="space-y-2">
            <Label htmlFor="product">Select Product</Label>
            <Select 
              value={formData.product} 
              onValueChange={(value) => setFormData({ ...formData, product: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a loan product" />
              </SelectTrigger>
              <SelectContent>
                {activeProducts.map(product => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} - {product.interestRate}% interest
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProduct && (
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Info className="h-4 w-4 text-accent" />
                <span className="font-medium">Product Details</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedProduct.description}
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                <div>
                  <span className="text-muted-foreground">Amount Range:</span>
                  <p className="font-medium">
                    {formatCurrency(selectedProduct.minAmount)} - {formatCurrency(selectedProduct.maxAmount)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Max Term:</span>
                  <p className="font-medium">
                    {selectedProduct.maxTerm} {selectedProduct.termUnit}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loan Details */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-semibold">Loan Details</h2>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Loan Amount (K)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="e.g., 50000"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                min={selectedProduct?.minAmount || 0}
                max={selectedProduct?.maxAmount || 999999999}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="term">
                Repayment Period ({selectedProduct?.termUnit || 'months'})
              </Label>
              <Input
                id="term"
                type="number"
                placeholder="e.g., 12"
                value={formData.term}
                onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                min={1}
                max={selectedProduct?.maxTerm || 48}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose of Loan</Label>
            <Textarea
              id="purpose"
              placeholder="Describe what you need the loan for..."
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              rows={3}
            />
          </div>
        </div>

        {/* Estimated Payment */}
        {estimatedPayment && (
          <div className="rounded-xl border-2 border-accent/20 bg-accent/5 p-6 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                <Calculator className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estimated Payment</p>
                <p className="text-2xl font-bold text-accent">
                  {formatCurrency(estimatedPayment)}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{selectedProduct?.termUnit === 'weeks' ? 'week' : 'month'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <Button 
          type="submit" 
          variant="accent" 
          size="lg" 
          className="w-full"
          disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting ? (
            'Submitting Application...'
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Submit Application
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
