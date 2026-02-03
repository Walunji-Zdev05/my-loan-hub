import { Link } from 'react-router-dom';
import { 
  Wallet, 
  TrendingUp, 
  AlertTriangle, 
  Percent,
  ClipboardList,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { 
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

import { StatCard } from '@/components/shared/StatCard';
import { Button } from '@/components/ui/button';
import { useLoanStats, useLoans } from '@/hooks/useLoans';
import { useClients, useClientStats } from '@/hooks/useClients';
import { useRealtimeLoans } from '@/hooks/useRealtimeLoans';

export default function AdminDashboard() {
  // Enable global real-time subscriptions
  useRealtimeLoans();

  const { data: stats, isLoading: statsLoading } = useLoanStats();
  const { data: pendingLoans, isLoading: loansLoading } = useLoans('applied');
  const { data: clients } = useClients();
  const { data: clientStats } = useClientStats();

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `K${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `K${(amount / 1000).toFixed(1)}K`;
    }
    return `K${amount.toLocaleString()}`;
  };

  const formatFullCurrency = (amount: number) => 
    `K${amount.toLocaleString()}`;

  // Loan status distribution for pie chart
  const loanStatuses = [
    { name: 'Active', value: stats?.activeLoansCount || 0, color: 'hsl(173, 58%, 39%)' },
    { name: 'Overdue', value: stats?.overdueCount || 0, color: 'hsl(0, 84%, 60%)' },
    { name: 'Pending', value: pendingLoans?.length || 0, color: 'hsl(38, 92%, 50%)' },
  ].filter(item => item.value > 0);

  if (statsLoading || loansLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl lg:text-3xl">Admin Dashboard</h1>
          <p className="mt-1 text-sm sm:text-base text-muted-foreground">
            Overview of your lending operations
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Button variant="outline" size="sm" className="h-10 sm:h-9" asChild>
            <Link to="/admin/applications">
              <ClipboardList className="mr-2 h-4 w-4" />
              {pendingLoans?.length || 0} Pending
            </Link>
          </Button>
          <Button variant="accent" size="sm" className="h-10 sm:h-9" asChild>
            <Link to="/admin/payments">
              Record Payment
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Disbursed"
          value={formatCurrency(stats?.totalDisbursed || 0)}
          icon={<Wallet className="h-5 w-5" />}
          variant="primary"
        />
        <StatCard
          title="Outstanding Balance"
          value={formatCurrency(stats?.outstandingBalance || 0)}
          subtitle={`${stats?.activeLoansCount || 0} active loans`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          title="Overdue Loans"
          value={stats?.overdueCount || 0}
          subtitle={formatFullCurrency(stats?.overdueAmount || 0)}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <StatCard
          title="Collection Rate"
          value={`${stats?.collectionRate || 0}%`}
          icon={<Percent className="h-5 w-5" />}
          variant="accent"
        />
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Loan Status Distribution */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 animate-slide-up">
          <h2 className="text-base sm:text-lg font-semibold mb-4">Loan Status</h2>
          {loanStatuses.length > 0 ? (
            <>
              <div className="h-[180px] sm:h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={loanStatuses}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {loanStatuses.map((entry, index) => (
                        <Cell key={`status-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${value} loans`, 'Count']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(0, 0%, 100%)',
                        border: '1px solid hsl(215, 20%, 88%)',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {loanStatuses.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-center py-8 text-muted-foreground">No loans yet</p>
          )}
        </div>

        {/* Quick Stats */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-4 sm:p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-semibold">Pending Applications</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/applications">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {pendingLoans?.slice(0, 5).map((loan) => (
              <div 
                key={loan.id}
                className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {loan.clients?.first_name} {loan.clients?.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {loan.loan_products?.name} · {formatFullCurrency(Number(loan.principal_amount))}
                  </p>
                </div>
                <div className="flex items-center justify-between sm:flex-col sm:text-right sm:items-end gap-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {new Date(loan.applied_at).toLocaleDateString()}
                  </p>
                  <Link 
                    to="/admin/applications" 
                    className="text-sm font-medium text-accent hover:underline"
                  >
                    Review
                  </Link>
                </div>
              </div>
            ))}
            {(!pendingLoans || pendingLoans.length === 0) && (
              <p className="text-center py-8 text-muted-foreground">
                No pending applications
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <p className="text-sm text-muted-foreground">Total Clients</p>
          <p className="text-2xl font-bold mt-1">{clients?.length || 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <p className="text-sm text-muted-foreground">Pending Clients</p>
          <p className="text-2xl font-bold mt-1 text-warning">{clientStats?.pending || 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <p className="text-sm text-muted-foreground">Approved Clients</p>
          <p className="text-2xl font-bold mt-1 text-success">{clientStats?.approved || 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <p className="text-sm text-muted-foreground">Paid Off Loans</p>
          <p className="text-2xl font-bold mt-1 text-success">{stats?.paidLoansCount || 0}</p>
        </div>
      </div>
    </div>
  );
}
