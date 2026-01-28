import { Link } from 'react-router-dom';
import { 
  Wallet, 
  CalendarClock, 
  TrendingUp, 
  ArrowRight,
  CreditCard 
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { loans, payments, generateSchedule } from '@/lib/mockData';

export default function BorrowerDashboard() {
  const { user } = useSupabaseAuth();
  
  // Get user's active loan
  const userLoans = loans.filter(l => l.clientId === user?.id);
  const activeLoan = userLoans.find(l => l.status === 'active' || l.status === 'overdue');
  const recentPayments = payments
    .filter(p => userLoans.some(l => l.id === p.loanId))
    .slice(0, 5);

  const formatCurrency = (amount: number) => 
    `K${amount.toLocaleString()}`;

  const formatDate = (date: string) => 
    new Date(date).toLocaleDateString('en-MW', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });

  const paymentColumns = [
    {
      key: 'date',
      header: 'Date',
      cell: (payment: typeof payments[0]) => formatDate(payment.date),
    },
    {
      key: 'amount',
      header: 'Amount',
      cell: (payment: typeof payments[0]) => (
        <span className="font-medium">{formatCurrency(payment.amount)}</span>
      ),
    },
    {
      key: 'method',
      header: 'Method',
      cell: (payment: typeof payments[0]) => (
        <span className="capitalize">{payment.method}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (payment: typeof payments[0]) => (
        <StatusBadge status={payment.status} />
      ),
    },
  ];

  return (
    <DashboardLayout requiredRole="borrower">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold lg:text-3xl">
              Welcome back, {user?.email?.split('@')[0]}
            </h1>
            <p className="mt-1 text-muted-foreground">
              Here's an overview of your loan status
            </p>
          </div>
          <Button variant="accent" asChild>
            <Link to="/borrower/apply">
              Apply for New Loan
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Outstanding Balance"
            value={formatCurrency(activeLoan?.outstandingBalance || 0)}
            subtitle={activeLoan ? `of ${formatCurrency(activeLoan.amount)}` : 'No active loan'}
            icon={<Wallet className="h-5 w-5" />}
            variant="primary"
          />
          <StatCard
            title="Next Payment"
            value={activeLoan ? formatCurrency(activeLoan.nextPaymentAmount) : '—'}
            subtitle={activeLoan?.nextPaymentDate ? `Due ${formatDate(activeLoan.nextPaymentDate)}` : 'N/A'}
            icon={<CalendarClock className="h-5 w-5" />}
          />
          <StatCard
            title="Loan Status"
            value={activeLoan?.status?.charAt(0).toUpperCase() + activeLoan?.status?.slice(1) || 'None'}
            subtitle={activeLoan?.product || 'Apply for a loan'}
            icon={<CreditCard className="h-5 w-5" />}
          />
          <StatCard
            title="Total Loans"
            value={userLoans.length}
            subtitle={`${userLoans.filter(l => l.status === 'paid').length} completed`}
            icon={<TrendingUp className="h-5 w-5" />}
          />
        </div>

        {/* Current Loan Details */}
        {activeLoan && (
          <div className="rounded-xl border border-border bg-card p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Current Loan Details</h2>
              <StatusBadge status={activeLoan.status} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Product</p>
                <p className="font-medium">{activeLoan.product}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Principal Amount</p>
                <p className="font-medium">{formatCurrency(activeLoan.amount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Interest Rate</p>
                <p className="font-medium">{activeLoan.interestRate}% p.a.</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Term</p>
                <p className="font-medium">{activeLoan.term} {activeLoan.termUnit}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Repayment Progress</span>
                <span className="font-medium">
                  {Math.round((1 - activeLoan.outstandingBalance / activeLoan.amount) * 100)}%
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full rounded-full bg-accent transition-all duration-500"
                  style={{ 
                    width: `${(1 - activeLoan.outstandingBalance / activeLoan.amount) * 100}%` 
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Recent Payments */}
        <div className="space-y-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Payments</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/borrower/schedule">
                View Schedule
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <DataTable 
            columns={paymentColumns} 
            data={recentPayments}
            emptyMessage="No payments yet"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
