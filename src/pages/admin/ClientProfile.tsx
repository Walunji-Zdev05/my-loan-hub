import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Download, 
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Briefcase,
  MapPin,
  Pencil,
  FilePlus
} from 'lucide-react';

import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ClientEditDialog } from '@/components/admin/ClientEditDialog';
import type { Client } from '@/hooks/useClients';

interface PaymentHistoryItem {
  id: string;
  date: string;
  amount: number;
  type: 'principal' | 'interest' | 'penalty' | 'fee';
  paymentStatus: 'on-time' | 'late';
  loanId: string;
  loanNumber: string;
}

export default function ClientProfile() {
  const navigate = useNavigate();
  const { clientId } = useParams<{ clientId: string }>();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Fetch client data
  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  // Fetch client's loans
  const { data: clientLoans = [], isLoading: loansLoading } = useQuery({
    queryKey: ['client-loans', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('client_id', clientId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId,
  });

  // Fetch repayments for client's loans
  const { data: repayments = [], isLoading: repaymentsLoading } = useQuery({
    queryKey: ['client-repayments', clientId],
    queryFn: async () => {
      if (clientLoans.length === 0) return [];
      
      const loanIds = clientLoans.map(l => l.id);
      const { data, error } = await supabase
        .from('repayments')
        .select('*')
        .in('loan_id', loanIds)
        .order('paid_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: clientLoans.length > 0,
  });

  // Fetch fee payments for client's loans
  const { data: feePayments = [] } = useQuery({
    queryKey: ['client-fee-payments', clientId],
    queryFn: async () => {
      if (clientLoans.length === 0) return [];
      
      const loanIds = clientLoans.map(l => l.id);
      const { data, error } = await supabase
        .from('fees_payments')
        .select('*')
        .in('loan_id', loanIds)
        .order('paid_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: clientLoans.length > 0,
  });

  const isLoading = clientLoading || loansLoading || repaymentsLoading;

  // Build payment history from repayments and fee payments
  const paymentHistory: PaymentHistoryItem[] = [];
  
  // Add repayments
  repayments.forEach(r => {
    const loan = clientLoans.find(l => l.id === r.loan_id);
    if (!loan) return;

    if (r.principal_portion && r.principal_portion > 0) {
      paymentHistory.push({
        id: `${r.id}-principal`,
        date: r.paid_at,
        amount: Number(r.principal_portion),
        type: 'principal',
        paymentStatus: 'on-time', // Could be calculated based on due date
        loanId: loan.id,
        loanNumber: loan.loan_number,
      });
    }

    if (r.interest_portion && r.interest_portion > 0) {
      paymentHistory.push({
        id: `${r.id}-interest`,
        date: r.paid_at,
        amount: Number(r.interest_portion),
        type: 'interest',
        paymentStatus: 'on-time',
        loanId: loan.id,
        loanNumber: loan.loan_number,
      });
    }

    // If no breakdown, add as principal
    if (!r.principal_portion && !r.interest_portion) {
      paymentHistory.push({
        id: r.id,
        date: r.paid_at,
        amount: Number(r.amount),
        type: 'principal',
        paymentStatus: 'on-time',
        loanId: loan.id,
        loanNumber: loan.loan_number,
      });
    }
  });

  // Add fee payments
  feePayments.forEach(f => {
    const loan = clientLoans.find(l => l.id === f.loan_id);
    if (!loan) return;

    paymentHistory.push({
      id: f.id,
      date: f.paid_at,
      amount: Number(f.amount),
      type: f.fee_type === 'penalty' ? 'penalty' : 'fee',
      paymentStatus: 'on-time',
      loanId: loan.id,
      loanNumber: loan.loan_number,
    });
  });

  // Sort by date descending
  paymentHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-MW', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const formatCurrency = (amount: number) =>
    `K${amount.toLocaleString()}`;

  // Calculate performance metrics
  const calculateMetrics = () => {
    const totalPayments = repayments.length;
    const onTimePayments = totalPayments; // Simplified - would need due date comparison
    const latePayments = 0;
    const defaultCount = clientLoans.filter(l => l.status === 'overdue').length;

    const repaymentRate = totalPayments > 0 
      ? Math.round((onTimePayments / totalPayments) * 100) 
      : 100;

    const totalPaid = repayments.reduce((sum, r) => sum + Number(r.amount), 0) +
                      feePayments.reduce((sum, f) => sum + Number(f.amount), 0);

    return {
      totalPayments,
      onTimePayments,
      latePayments,
      repaymentRate,
      totalPaid,
      defaultCount,
      totalLoans: clientLoans.length,
      activeLoans: clientLoans.filter(l => ['active', 'overdue', 'disbursed'].includes(l.status)).length,
      completedLoans: clientLoans.filter(l => l.status === 'paid').length,
      totalBorrowed: clientLoans.reduce((sum, l) => sum + Number(l.principal_amount), 0),
      outstandingBalance: clientLoans.reduce((sum, l) => sum + Number(l.outstanding_balance), 0),
    };
  };

  const metrics = calculateMetrics();

  const exportToExcel = () => {
    if (!client) return;
    
    const clientName = `${client.first_name} ${client.last_name}`;
    const headers = ['Payment Date', 'Amount', 'Type', 'Status', 'Loan Number'];
    const rows = paymentHistory.map(p => [
      formatDate(p.date),
      p.amount.toString(),
      p.type.charAt(0).toUpperCase() + p.type.slice(1),
      p.paymentStatus === 'on-time' ? 'On-Time' : 'Late',
      p.loanNumber,
    ]);
    
    const csvContent = [
      `Payment History - ${clientName}`,
      `Exported on ${formatDate(new Date().toISOString())}`,
      '',
      `Performance Summary`,
      `Repayment Rate: ${metrics.repaymentRate}%`,
      `Total Paid: ${formatCurrency(metrics.totalPaid)}`,
      `Defaults: ${metrics.defaultCount}`,
      '',
      headers.join(','),
      ...rows.map(r => r.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const today = new Date().toISOString().split('T')[0];
    link.download = `${clientName.replace(/\s+/g, '_')}_payment_history_${today}.csv`;
    link.click();

    toast({
      title: 'Export Successful',
      description: 'Payment history has been exported to Excel',
    });
  };

  const paymentColumns = [
    {
      key: 'date',
      header: 'Payment Date',
      cell: (item: PaymentHistoryItem) => formatDate(item.date),
    },
    {
      key: 'amount',
      header: 'Amount',
      cell: (item: PaymentHistoryItem) => (
        <span className="font-medium">{formatCurrency(item.amount)}</span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      cell: (item: PaymentHistoryItem) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
          item.type === 'principal' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
          item.type === 'interest' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
          item.type === 'penalty' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
          'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
        }`}>
          {item.type}
        </span>
      ),
    },
    {
      key: 'paymentStatus',
      header: 'Status',
      cell: (item: PaymentHistoryItem) => (
        <span className={`inline-flex items-center gap-1 text-sm ${
          item.paymentStatus === 'on-time' ? 'text-success' : 'text-destructive'
        }`}>
          {item.paymentStatus === 'on-time' ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          <span>{item.paymentStatus === 'on-time' ? 'On-Time' : 'Late'}</span>
        </span>
      ),
    },
    {
      key: 'loanNumber',
      header: 'Loan',
      cell: (item: PaymentHistoryItem) => (
        <span className="font-mono text-sm">{item.loanNumber}</span>
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

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Client not found</p>
        <Button className="mt-4" onClick={() => navigate('/admin/clients')}>
          Back to Clients
        </Button>
      </div>
    );
  }

  const clientName = `${client.first_name} ${client.last_name}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/clients')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Client Profile</h1>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-mono font-semibold bg-primary/10 text-primary">
              {client.client_number}
            </span>
          </div>
          <p className="mt-1 text-muted-foreground">
            View detailed client information and performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          {client.status === 'approved' && (
            <Button variant="accent" onClick={() => navigate(`/admin/applications/new?clientId=${client.id}`)}>
              <FilePlus className="h-4 w-4 mr-2" />
              Apply for Loan
            </Button>
          )}
          <Button onClick={() => setEditDialogOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit Client
          </Button>
        </div>
      </div>

      {/* Edit Dialog */}
      <ClientEditDialog
        client={client as Client}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      {/* Client Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-semibold">
              {client.first_name.charAt(0)}
            </div>
            <div className="flex-1 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{clientName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{client.email || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{client.phone || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="font-medium">{formatDate(client.created_at)}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Occupation</p>
                <p className="font-medium">{client.occupation || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Employer</p>
                <p className="font-medium">{client.employer || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{client.address || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Monthly Income</p>
                <p className="font-medium">{client.monthly_income ? formatCurrency(Number(client.monthly_income)) : 'N/A'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Performance Summary</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Repayment Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${
                metrics.repaymentRate >= 80 ? 'text-success' :
                metrics.repaymentRate >= 60 ? 'text-warning' : 'text-destructive'
              }`}>
                {metrics.repaymentRate}%
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {metrics.onTimePayments} of {metrics.totalPayments} on-time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Total Paid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-success">{formatCurrency(metrics.totalPaid)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                All payments combined
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Defaults
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${metrics.defaultCount > 0 ? 'text-destructive' : 'text-success'}`}>
                {metrics.defaultCount}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Overdue loans
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Outstanding Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(metrics.outstandingBalance)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {metrics.activeLoans} active loans
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Loan Completion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-success">{metrics.completedLoans}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Loans fully repaid
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment History */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Payment History</h2>
          <Button variant="outline" onClick={exportToExcel} disabled={paymentHistory.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export to Excel
          </Button>
        </div>
        <DataTable
          columns={paymentColumns}
          data={paymentHistory}
          emptyMessage="No payment history found"
        />
      </div>
    </div>
  );
}
