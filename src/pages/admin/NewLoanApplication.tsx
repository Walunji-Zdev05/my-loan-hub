import { useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calculator, 
  Upload, 
  X, 
  FileText,
  Loader2,
  AlertCircle 
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

import { useClients } from '@/hooks/useClients';
import { useLoanProducts } from '@/hooks/useLoanProducts';
import { useCreateLoan } from '@/hooks/useLoans';
import { supabase } from '@/integrations/supabase/client';

interface UploadedDocument {
  name: string;
  path: string;
  size: number;
}

export default function NewLoanApplication() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedClientId = searchParams.get('clientId');
  
  const { toast } = useToast();
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const { data: loanProducts = [], isLoading: productsLoading } = useLoanProducts(true);
  const createLoan = useCreateLoan();

  // Form state
  const [clientId, setClientId] = useState(preselectedClientId || '');
  const [productId, setProductId] = useState('');
  const [amount, setAmount] = useState('');
  const [termMonths, setTermMonths] = useState('');
  const [purpose, setPurpose] = useState('');
  const [guarantorName, setGuarantorName] = useState('');
  const [guarantorPhone, setGuarantorPhone] = useState('');
  const [guarantorRelationship, setGuarantorRelationship] = useState('');
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [uploading, setUploading] = useState(false);

  // Get approved clients only
  const approvedClients = useMemo(() => 
    clients.filter(c => c.status === 'approved'),
    [clients]
  );

  // Get selected client and product
  const selectedClient = useMemo(() => 
    clients.find(c => c.id === clientId),
    [clients, clientId]
  );

  const selectedProduct = useMemo(() => 
    loanProducts.find(p => p.id === productId),
    [loanProducts, productId]
  );

  // Validate amount against product limits
  const amountNum = parseFloat(amount) || 0;
  const termNum = parseInt(termMonths) || 0;

  const amountError = useMemo(() => {
    if (!selectedProduct || !amount) return null;
    if (amountNum < selectedProduct.min_amount) {
      return `Minimum amount is K${selectedProduct.min_amount.toLocaleString()}`;
    }
    if (amountNum > selectedProduct.max_amount) {
      return `Maximum amount is K${selectedProduct.max_amount.toLocaleString()}`;
    }
    return null;
  }, [selectedProduct, amount, amountNum]);

  const termError = useMemo(() => {
    if (!selectedProduct || !termMonths) return null;
    if (termNum < selectedProduct.min_term_months) {
      return `Minimum term is ${selectedProduct.min_term_months} months`;
    }
    if (termNum > selectedProduct.max_term_months) {
      return `Maximum term is ${selectedProduct.max_term_months} months`;
    }
    return null;
  }, [selectedProduct, termMonths, termNum]);

  // Calculate loan details (weekly installments; term is in months)
  const loanCalculation = useMemo(() => {
    if (!selectedProduct || !amountNum || !termNum) return null;

    const principal = amountNum;
    const rate = selectedProduct.interest_rate / 100; // per month
    const weeks = Math.max(1, Math.round((termNum * 52) / 12));
    let totalInterest = 0;
    let totalAmount = 0;
    let weeklyPayment = 0;

    if (selectedProduct.interest_type === 'flat_rate') {
      totalInterest = principal * rate * termNum;
      totalAmount = principal + totalInterest;
      weeklyPayment = totalAmount / weeks;
    } else {
      // Reducing balance (amortized, weekly rate equivalent)
      const weeklyRate = rate * (12 / 52);
      if (weeklyRate === 0) {
        weeklyPayment = principal / weeks;
        totalAmount = principal;
        totalInterest = 0;
      } else {
        const factor = Math.pow(1 + weeklyRate, weeks);
        weeklyPayment = (principal * weeklyRate * factor) / (factor - 1);
        totalAmount = weeklyPayment * weeks;
        totalInterest = totalAmount - principal;
      }
    }

    return {
      principal,
      weeks,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      weeklyPayment: Math.round(weeklyPayment * 100) / 100,
      applicationFee: selectedProduct.application_fee,
      approvalFee: selectedProduct.approval_fee,
    };
  }, [selectedProduct, amountNum, termNum]);

  // Handle file upload
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedDocs: UploadedDocument[] = [];

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `applications/${fileName}`;

        const { error } = await supabase.storage
          .from('loan-documents')
          .upload(filePath, file);

        if (error) throw error;

        uploadedDocs.push({
          name: file.name,
          path: filePath,
          size: file.size,
        });
      }

      setDocuments(prev => [...prev, ...uploadedDocs]);
      toast({ title: 'Documents uploaded', description: `${uploadedDocs.length} file(s) uploaded successfully.` });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload documents',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }, [toast]);

  // Remove uploaded document
  const removeDocument = useCallback(async (index: number) => {
    const doc = documents[index];
    try {
      await supabase.storage.from('loan-documents').remove([doc.path]);
      setDocuments(prev => prev.filter((_, i) => i !== index));
    } catch (error) {
      console.error('Failed to remove document:', error);
    }
  }, [documents]);

  // Check if form is valid
  const isFormValid = useMemo(() => {
    return (
      clientId &&
      productId &&
      amountNum > 0 &&
      termNum > 0 &&
      !amountError &&
      !termError &&
      selectedClient?.status === 'approved'
    );
  }, [clientId, productId, amountNum, termNum, amountError, termError, selectedClient]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid || !loanCalculation || !selectedProduct) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields correctly.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createLoan.mutateAsync({
        client_id: clientId,
        product_id: productId,
        principal_amount: loanCalculation.principal,
        interest_rate: selectedProduct.interest_rate,
        interest_type: selectedProduct.interest_type,
        term_months: termNum,
        total_amount: loanCalculation.totalAmount,
        monthly_payment: loanCalculation.weeklyPayment,
        outstanding_balance: loanCalculation.totalAmount,
        status: 'applied',
        purpose,
        guarantor_name: guarantorName || null,
        guarantor_phone: guarantorPhone || null,
        guarantor_relationship: guarantorRelationship || null,
        documents: documents.length > 0 ? JSON.parse(JSON.stringify(documents)) : [],
      });

      toast({
        title: 'Application Submitted',
        description: 'The loan application has been submitted for review.',
      });

      navigate('/admin/applications');
    } catch (error) {
      toast({
        title: 'Submission Failed',
        description: error instanceof Error ? error.message : 'Failed to submit application',
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (amount: number) => `K${amount.toLocaleString()}`;

  const isLoading = clientsLoading || productsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New Loan Application</h1>
          <p className="mt-1 text-muted-foreground">
            Submit a new loan application for an approved client
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client & Product Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Loan Details</CardTitle>
                <CardDescription>Select client and loan product</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Client Selection */}
                <div className="space-y-2">
                  <Label htmlFor="client">Client *</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger id="client">
                      <SelectValue placeholder="Select an approved client" />
                    </SelectTrigger>
                    <SelectContent>
                      {approvedClients.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          No approved clients available
                        </div>
                      ) : (
                        approvedClients.map(client => (
                          <SelectItem key={client.id} value={client.id}>
                            <span className="font-mono text-xs text-muted-foreground mr-2">{client.client_number}</span>
                            <span className="font-medium">{client.first_name} {client.last_name}</span>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {selectedClient && selectedClient.status !== 'approved' && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        This client is not approved. Only approved clients can apply for loans.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Product Selection */}
                <div className="space-y-2">
                  <Label htmlFor="product">Loan Product *</Label>
                  <Select value={productId} onValueChange={setProductId}>
                    <SelectTrigger id="product">
                      <SelectValue placeholder="Select a loan product" />
                    </SelectTrigger>
                    <SelectContent>
                      {loanProducts.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - {product.interest_rate}% ({product.interest_type === 'flat_rate' ? 'Flat' : 'Reducing'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedProduct && (
                    <p className="text-sm text-muted-foreground">
                      Amount: {formatCurrency(selectedProduct.min_amount)} - {formatCurrency(selectedProduct.max_amount)} | 
                      Term: {selectedProduct.min_term_months} - {selectedProduct.max_term_months} months
                    </p>
                  )}
                </div>

                {/* Amount & Term */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Requested Amount (K) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="e.g., 50000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min={selectedProduct?.min_amount || 0}
                      max={selectedProduct?.max_amount}
                    />
                    {amountError && (
                      <p className="text-sm text-destructive">{amountError}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="term">Term (months) *</Label>
                    <Input
                      id="term"
                      type="number"
                      placeholder="e.g., 12"
                      value={termMonths}
                      onChange={(e) => setTermMonths(e.target.value)}
                      min={selectedProduct?.min_term_months || 1}
                      max={selectedProduct?.max_term_months}
                    />
                    {termError && (
                      <p className="text-sm text-destructive">{termError}</p>
                    )}
                  </div>
                </div>

                {/* Purpose */}
                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose / Use of Funds</Label>
                  <Textarea
                    id="purpose"
                    placeholder="Describe the intended use of the loan funds..."
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Guarantor Details */}
            <Card>
              <CardHeader>
                <CardTitle>Guarantor Details</CardTitle>
                <CardDescription>Optional: Provide guarantor information if required</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="guarantorName">Guarantor Name</Label>
                    <Input
                      id="guarantorName"
                      placeholder="Full name"
                      value={guarantorName}
                      onChange={(e) => setGuarantorName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guarantorPhone">Phone Number</Label>
                    <Input
                      id="guarantorPhone"
                      placeholder="Phone number"
                      value={guarantorPhone}
                      onChange={(e) => setGuarantorPhone(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guarantorRelationship">Relationship to Client</Label>
                  <Input
                    id="guarantorRelationship"
                    placeholder="e.g., Spouse, Business Partner, Friend"
                    value={guarantorRelationship}
                    onChange={(e) => setGuarantorRelationship(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Document Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Supporting Documents</CardTitle>
                <CardDescription>Upload business photos, proof of income, ID copies, etc.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="document-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {uploading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            PDF, Images, Documents (max 20MB)
                          </p>
                        </>
                      )}
                    </div>
                    <input
                      id="document-upload"
                      type="file"
                      className="hidden"
                      multiple
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>

                {documents.length > 0 && (
                  <div className="space-y-2">
                    {documents.map((doc, index) => (
                      <div
                        key={doc.path}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(doc.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDocument(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Calculator Sidebar */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Loan Calculator
                </CardTitle>
                <CardDescription>Preview of loan repayment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loanCalculation ? (
                  <>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Principal</span>
                        <span className="font-medium">{formatCurrency(loanCalculation.principal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Interest ({selectedProduct?.interest_type === 'flat_rate' ? 'Flat' : 'Reducing'})</span>
                        <span className="font-medium">{formatCurrency(loanCalculation.totalInterest)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg">
                        <span className="font-medium">Total Repayable</span>
                        <span className="font-bold text-primary">{formatCurrency(loanCalculation.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Weekly Installment ({loanCalculation.weeks} weeks)</span>
                        <span className="font-semibold text-success">{formatCurrency(loanCalculation.weeklyPayment)}</span>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Fees (paid separately)</p>
                      <div className="flex justify-between text-sm">
                        <span>Application Fee</span>
                        <span>{formatCurrency(loanCalculation.applicationFee)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Approval Fee</span>
                        <span>{formatCurrency(loanCalculation.approvalFee)}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calculator className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Select a product and enter amount to see calculations</p>
                  </div>
                )}

                <Separator />

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={!isFormValid || createLoan.isPending}
                >
                  {createLoan.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>

                {!clientId && (
                  <p className="text-xs text-muted-foreground text-center">
                    Select an approved client to continue
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
