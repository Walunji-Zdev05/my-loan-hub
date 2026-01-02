import { useState } from 'react';
import { Plus, Edit2, Trash2, Package } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
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
import { loanProducts, LoanProduct } from '@/lib/mockData';

export default function LoanProducts() {
  const { toast } = useToast();
  const [products, setProducts] = useState(loanProducts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<LoanProduct | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    minAmount: '',
    maxAmount: '',
    interestRate: '',
    interestType: 'flat' as 'flat' | 'reducing',
    maxTerm: '',
    termUnit: 'months' as 'months' | 'weeks',
    isActive: true,
  });

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-MW', { style: 'currency', currency: 'MWK' }).format(amount);

  const openModal = (product?: LoanProduct) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        minAmount: product.minAmount.toString(),
        maxAmount: product.maxAmount.toString(),
        interestRate: product.interestRate.toString(),
        interestType: (product as any).interestType || 'flat',
        maxTerm: product.maxTerm.toString(),
        termUnit: product.termUnit,
        isActive: product.isActive,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        minAmount: '',
        maxAmount: '',
        interestRate: '',
        interestType: 'flat',
        maxTerm: '',
        termUnit: 'months',
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const productData: LoanProduct = {
      id: editingProduct?.id || `PR${(products.length + 1).toString().padStart(3, '0')}`,
      name: formData.name,
      description: formData.description,
      minAmount: parseFloat(formData.minAmount),
      maxAmount: parseFloat(formData.maxAmount),
      interestRate: parseFloat(formData.interestRate),
      maxTerm: parseInt(formData.maxTerm),
      termUnit: formData.termUnit,
      isActive: formData.isActive,
    };

    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? productData : p));
      toast({ title: 'Product Updated', description: `${productData.name} has been updated.` });
    } else {
      setProducts(prev => [...prev, productData]);
      toast({ title: 'Product Created', description: `${productData.name} has been created.` });
    }

    setIsModalOpen(false);
  };

  const toggleStatus = (productId: string) => {
    setProducts(prev => 
      prev.map(p => 
        p.id === productId ? { ...p, isActive: !p.isActive } : p
      )
    );
  };

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Loan Products</h1>
            <p className="mt-1 text-muted-foreground">
              Manage your loan product offerings
            </p>
          </div>
          <Button variant="accent" onClick={() => openModal()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>

        {/* Products Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map(product => (
            <div 
              key={product.id}
              className={`rounded-xl border bg-card p-6 transition-all ${
                product.isActive ? 'border-border' : 'border-dashed opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={product.isActive}
                    onCheckedChange={() => toggleStatus(product.id)}
                  />
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => openModal(product)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <h3 className="font-semibold text-lg">{product.name}</h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {product.description}
              </p>

              <div className="mt-4 pt-4 border-t border-border space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount Range</span>
                  <span className="font-medium">
                    {formatCurrency(product.minAmount)} - {formatCurrency(product.maxAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Interest Rate</span>
                  <span className="font-medium text-accent">{product.interestRate}% p.a.</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Interest Type</span>
                  <span className="font-medium">
                    {(product as any).interestType === 'reducing' ? 'Reducing Balance' : 'Flat Rate'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Max Term</span>
                  <span className="font-medium">{product.maxTerm} {product.termUnit}</span>
                </div>
              </div>

              <div className="mt-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  product.isActive 
                    ? 'bg-success/10 text-success' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {product.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Add/Edit Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-lg">
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
                  <Label htmlFor="minAmount">Min Amount (MWK)</Label>
                  <Input
                    id="minAmount"
                    type="number"
                    value={formData.minAmount}
                    onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxAmount">Max Amount (MWK)</Label>
                  <Input
                    id="maxAmount"
                    type="number"
                    value={formData.maxAmount}
                    onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="interestRate">Interest Rate (%)</Label>
                  <Input
                    id="interestRate"
                    type="number"
                    step="0.1"
                    value={formData.interestRate}
                    onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interestType">Interest Type</Label>
                  <Select 
                    value={formData.interestType} 
                    onValueChange={(value: 'flat' | 'reducing') => setFormData({ ...formData, interestType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flat">Flat Rate</SelectItem>
                      <SelectItem value="reducing">Reducing Balance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="maxTerm">Max Term</Label>
                  <Input
                    id="maxTerm"
                    type="number"
                    value={formData.maxTerm}
                    onChange={(e) => setFormData({ ...formData, maxTerm: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="termUnit">Term Unit</Label>
                  <Select 
                    value={formData.termUnit} 
                    onValueChange={(value: 'months' | 'weeks') => setFormData({ ...formData, termUnit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="months">Months</SelectItem>
                      <SelectItem value="weeks">Weeks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch 
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Product is active</Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="accent">
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
