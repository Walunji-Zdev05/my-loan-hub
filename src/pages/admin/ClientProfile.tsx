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
  Clock
} from 'lucide-react';

import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { clients, loans, payments, loanApplications, generateSchedule } from '@/lib/mockData';
import { toast } from '@/hooks/use-toast';

interface PaymentHistoryItem {
  id: string;
  date: string;
  amount: number;
  type: 'principal' | 'interest' | 'penalty' | 'fee';
  paymentStatus: 'on-time' | 'late';
  loanId: string;
  product: string;
}

export default function ClientProfile() {
  const navigate = useNavigate();
  const { clientId } = useParams<{ clientId: string }>();
  
  const client = clients.find(c => c.id === clientId);
  const clientLoans = loans.filter(l => l.clientId === clientId);
  const clientApplications = loanApplications.filter(a => a.clientId === clientId);
  
  // Build payment history from payments and loan schedules with proper types
  const paymentHistory: PaymentHistoryItem[] = [];
  
  // Add actual payments with breakdown
  clientLoans.forEach(loan => {
    const loanPayments = payments.filter(p => p.loanId === loan.id);
    const schedule = generateSchedule(loan.id);
    
    loanPayments.forEach((p, idx) => {
      // Determine if payment was on-time by checking against schedule
      const scheduleItem = schedule.find(s => s.paidDate === p.date);
      const isOnTime = scheduleItem 
        ? new Date(scheduleItem.paidDate!) <= new Date(scheduleItem.dueDate)
        : true;
      
      // Split payment into principal and interest components (simulated breakdown)
      const principalRatio = 0.7;
      const interestRatio = 0.3;
      
      paymentHistory.push({
        id: `${p.id}-principal`,
        date: p.date,
        amount: Math.round(p.amount * principalRatio),
        type: 'principal',
        paymentStatus: isOnTime ? 'on-time' : 'late',
        loanId: loan.id,
        product: loan.product,
      });
      
      paymentHistory.push({
        id: `${p.id}-interest`,
        date: p.date,
        amount: Math.round(p.amount * interestRatio),
        type: 'interest',
        paymentStatus: isOnTime ? 'on-time' : 'late',
        loanId: loan.id,
        product: loan.product,
      });
      
      // Add penalty for late payments
      if (!isOnTime && idx % 3 === 0) {
        paymentHistory.push({
          id: `${p.id}-penalty`,
          date: p.date,
          amount: Math.round(p.amount * 0.05),
          type: 'penalty',
          paymentStatus: 'late',
          loanId: loan.id,
          product: loan.product,
        });
      }
    });
    
    // Add fee entries for loan processing
    if (loanPayments.length > 0) {
      paymentHistory.push({
        id: `${loan.id}-fee`,
        date: loan.disbursedDate,
        amount: Math.round(loan.amount * 0.02),
        type: 'fee',
        paymentStatus: 'on-time',
        loanId: loan.id,
        product: loan.product,
      });
    }
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
    let totalPayments = 0;
    let onTimePayments = 0;
    let latePayments = 0;
    let defaultCount = 0;

    clientLoans.forEach(loan => {
      const schedule = generateSchedule(loan.id);
      schedule.forEach(item => {
        if (item.status === 'paid') {
          totalPayments++;
          // Check if paid on time (paidDate exists and <= dueDate)
          if (item.paidDate && new Date(item.paidDate) <= new Date(item.dueDate)) {
            onTimePayments++;
          } else {
            latePayments++;
          }
        } else if (item.status === 'overdue') {
          // Count overdue items as potential defaults (over 90 days)
          const daysOverdue = Math.floor((new Date().getTime() - new Date(item.dueDate).getTime()) / (1000 * 60 * 60 * 24));
          if (daysOverdue > 90) {
            defaultCount++;
          }
        }
      });
    });

    const repaymentRate = totalPayments > 0 
      ? Math.round((onTimePayments / totalPayments) * 100) 
      : 0;

    const totalPaid = paymentHistory.reduce((sum, p) => sum + p.amount, 0);

    return {
      totalPayments,
      onTimePayments,
      latePayments,
      repaymentRate,
      totalPaid,
      defaultCount,
      totalLoans: clientLoans.length,
      activeLoans: clientLoans.filter(l => l.status === 'active' || l.status === 'overdue').length,
      completedLoans: clientLoans.filter(l => l.status === 'paid').length,
      totalBorrowed: clientLoans.reduce((sum, l) => sum + l.amount, 0),
      outstandingBalance: clientLoans.reduce((sum, l) => sum + l.outstandingBalance, 0),
    };
  };

  const metrics = calculateMetrics();

  const exportToExcel = () => {
    // Create CSV content with requested columns
    const headers = ['Payment Date', 'Amount', 'Type', 'Status', 'Loan ID', 'Product'];
    const rows = paymentHistory.map(p => [
      formatDate(p.date),
      p.amount.toString(),
      p.type.charAt(0).toUpperCase() + p.type.slice(1),
      p.paymentStatus === 'on-time' ? 'On-Time' : 'Late',
      p.loanId,
      p.product,
    ]);
    
    const csvContent = [
      `Payment History - ${client?.name}`,
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

    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const today = new Date().toISOString().split('T')[0];
    link.download = `${client?.name.replace(/\s+/g, '_')}_payment_history_${today}.csv`;
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
      key: 'loanId',
      header: 'Loan',
      cell: (item: PaymentHistoryItem) => (
        <div>
          <p className="font-medium">{item.loanId}</p>
          <p className="text-sm text-muted-foreground">{item.product}</p>
        </div>
      ),
    },
  ];

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/clients')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Client Profile</h1>
          <p className="mt-1 text-muted-foreground">
            View detailed client information and performance metrics
          </p>
        </div>
      </div>

      {/* Client Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-semibold">
              {client.name.charAt(0)}
            </div>
            <div className="flex-1 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{client.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{client.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{client.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="font-medium">{formatDate(client.joinDate)}</p>
                </div>
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
                90+ days overdue
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
          <Button variant="outline" onClick={exportToExcel}>
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
