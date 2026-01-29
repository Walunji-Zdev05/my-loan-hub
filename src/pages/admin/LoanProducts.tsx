import { useState } from 'react';
import { Plus, Edit2, Package, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useLoanProducts, useCreateLoanProduct, useUpdateLoanProduct, LoanProduct } from '@/hooks/useLoanProducts';
import type { Enums } from '@/integrations/supabase/types';

type InterestType = Enums<'interest_type'>;

export default function LoanProducts() {
  const { toast } = useToast();
  const { data: products, isLoading } = useLoanProducts();
  const createProduct = useCreateLoanProduct();
  const updateProduct = useUpdateLoanProduct();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<LoanProduct | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    min_amount: '',
    max_amount: '',
    interest_rate: '',
    interest_type: 'flat_rate' as InterestType,
    min_term_months: '',
    max_term_months: '',
    is_active: true,
    application_fee: '',
    approval_fee: '',
    penalty_rate: '',
  });

  const formatCurrency = (amount: number) => 
    `K${amount.toLocaleString()}`;

  const openModal = (product?: LoanProduct) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        min_amount: product.min_amount.toString(),
        max_amount: product.max_amount.toString(),
        interest_rate: product.interest_rate.toString(),
        interest_type: product.interest_type,
        min_term_months: product.min_term_months.toString(),
        max_term_months: product.max_term_months.toString(),
        is_active: product.is_active,
        application_fee: product.application_fee.toString(),
        approval_fee: product.approval_fee.toString(),
        penalty_rate: product.penalty_rate.toString(),
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        min_amount: '',
        max_amount: '',
        interest_rate: '',
        interest_type: 'flat_rate',
        min_term_months: '1',
        max_term_months: '',
        is_active: true,
        application_fee: '0',
        approval_fee: '0',
        penalty_rate: '0',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const productData = {
      name: formData.name,
      description: formData.description || null,
      min_amount: parseFloat(formData.min_amount),
      max_amount: parseFloat(formData.max_amount),
      interest_rate: parseFloat(formData.interest_rate),
      interest_type: formData.interest_type,
      min_term_months: parseInt(formData.min_term_months) || 1,
      max_term_months: parseInt(formData.max_term_months),
      is_active: formData.is_active,
      application_fee: parseFloat(formData.application_fee) || 0,
      approval_fee: parseFloat(formData.approval_fee) || 0,
      penalty_rate: parseFloat(formData.penalty_rate) || 0,
    };

    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({ id: editingProduct.id, ...productData });
        toast({ title: 'Product Updated', description: `${productData.name} has been updated.` });
      } else {
        await createProduct.mutateAsync(productData);
        toast({ title: 'Product Created', description: `${productData.name} has been created.` });
      }
      setIsModalOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save product',
        variant: 'destructive',
      });
    }
  };

  const toggleStatus = async (product: LoanProduct) => {
    try {
      await updateProduct.mutateAsync({ id: product.id, is_active: !product.is_active });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update product status',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Loan Products</h1>
          <p className="mt-1 text-sm sm:text-base text-muted-foreground">
            Manage your loan product offerings
          </p>
        </div>
        <Button variant="accent" onClick={() => openModal()} className="h-10 sm:h-9 w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Products Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {products?.map(product => (
          <div 
            key={product.id}
            className={`rounded-xl border bg-card p-4 sm:p-6 transition-all ${
              product.is_active ? 'border-border' : 'border-dashed opacity-60'
            }`}
          >
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary/10">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <Switch 
                  checked={product.is_active}
                  onCheckedChange={() => toggleStatus(product)}
                />
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => openModal(product)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <h3 className="font-semibold text-base sm:text-lg">{product.name}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {product.description || 'No description'}
            </p>

            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border space-y-1.5 sm:space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount Range</span>
                <span className="font-medium">
                  {formatCurrency(Number(product.min_amount))} - {formatCurrency(Number(product.max_amount))}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Interest Rate</span>
                <span className="font-medium text-accent">{product.interest_rate}% p.a.</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Interest Type</span>
                <span className="font-medium">
                  {product.interest_type === 'reducing_balance' ? 'Reducing Balance' : 'Flat Rate'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Term Range</span>
                <span className="font-medium">{product.min_term_months} - {product.max_term_months} months</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Application Fee</span>
                <span className="font-medium">{formatCurrency(Number(product.application_fee))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Approval Fee</span>
                <span className="font-medium">{formatCurrency(Number(product.approval_fee))}</span>
              </div>
            </div>

            <div className="mt-4">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                product.is_active 
                  ? 'bg-success/10 text-success' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {product.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ))}
        
        {products?.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No loan products yet. Click "Add Product" to create one.
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Personal Loan"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the product..."
                rows={2}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="min_amount">Min Amount (K)</Label>
                <Input
                  id="min_amount"
                  type="number"
                  value={formData.min_amount}
                  onChange={(e) => setFormData({ ...formData, min_amount: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_amount">Max Amount (K)</Label>
                <Input
                  id="max_amount"
                  type="number"
                  value={formData.max_amount}
                  onChange={(e) => setFormData({ ...formData, max_amount: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="interest_rate">Interest Rate (%)</Label>
                <Input
                  id="interest_rate"
                  type="number"
                  step="0.1"
                  value={formData.interest_rate}
                  onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interest_type">Interest Type</Label>
                <Select 
                  value={formData.interest_type} 
                  onValueChange={(value: InterestType) => setFormData({ ...formData, interest_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat_rate">Flat Rate</SelectItem>
                    <SelectItem value="reducing_balance">Reducing Balance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="min_term_months">Min Term (Months)</Label>
                <Input
                  id="min_term_months"
                  type="number"
                  value={formData.min_term_months}
                  onChange={(e) => setFormData({ ...formData, min_term_months: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_term_months">Max Term (Months)</Label>
                <Input
                  id="max_term_months"
                  type="number"
                  value={formData.max_term_months}
                  onChange={(e) => setFormData({ ...formData, max_term_months: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="application_fee">Application Fee (K)</Label>
                <Input
                  id="application_fee"
                  type="number"
                  value={formData.application_fee}
                  onChange={(e) => setFormData({ ...formData, application_fee: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="approval_fee">Approval Fee (K)</Label>
                <Input
                  id="approval_fee"
                  type="number"
                  value={formData.approval_fee}
                  onChange={(e) => setFormData({ ...formData, approval_fee: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="penalty_rate">Penalty Rate (%)</Label>
              <Input
                id="penalty_rate"
                type="number"
                step="0.1"
                value={formData.penalty_rate}
                onChange={(e) => setFormData({ ...formData, penalty_rate: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch 
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Product is active</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="accent"
                disabled={createProduct.isPending || updateProduct.isPending}
              >
                {(createProduct.isPending || updateProduct.isPending) ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
