import { Link } from 'react-router-dom';
import { 
  Wallet, 
  TrendingUp, 
  AlertTriangle, 
  Percent,
  Users,
  ClipboardList,
  ArrowRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

import { StatCard } from '@/components/shared/StatCard';
import { Button } from '@/components/ui/button';
import { 
  getDashboardStats, 
  getMonthlyDisbursements, 
  getCollectionTrend,
  getLoanPortfolio,
  getLoanStatusDistribution,
  loanApplications 
} from '@/lib/mockData';

export default function AdminDashboard() {
  const stats = getDashboardStats();
  const disbursements = getMonthlyDisbursements();
  const collections = getCollectionTrend();
  const portfolio = getLoanPortfolio();
  const loanStatuses = getLoanStatusDistribution();
  const pendingApps = loanApplications.filter(a => a.status === 'pending');

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-MW', { 
      style: 'currency', 
      currency: 'MWK',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);

  const formatFullCurrency = (amount: number) => 
    new Intl.NumberFormat('en-MW', { style: 'currency', currency: 'MWK' }).format(amount);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold lg:text-3xl">Admin Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Overview of your lending operations
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link to="/admin/applications">
              <ClipboardList className="mr-2 h-4 w-4" />
              {pendingApps.length} Pending
            </Link>
          </Button>
          <Button variant="accent" asChild>
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
          value={formatCurrency(stats.totalDisbursed)}
          icon={<Wallet className="h-5 w-5" />}
          trend={{ value: 12, label: 'vs last month' }}
          variant="primary"
        />
        <StatCard
          title="Outstanding Balance"
          value={formatCurrency(stats.outstandingBalance)}
          subtitle={`${stats.activeLoansCount} active loans`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          title="Overdue Loans"
          value={stats.overdueCount}
          subtitle={formatFullCurrency(stats.overdueAmount)}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <StatCard
          title="Collection Rate"
          value={`${stats.collectionRate}%`}
          icon={<Percent className="h-5 w-5" />}
          trend={{ value: 3.2, label: 'vs last month' }}
          variant="accent"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Disbursements Chart */}
        <div className="rounded-xl border border-border bg-card p-6 animate-slide-up">
          <h2 className="text-lg font-semibold mb-4">Monthly Disbursements</h2>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={disbursements}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(173, 58%, 39%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(173, 58%, 39%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 88%)" />
                <XAxis dataKey="month" stroke="hsl(215, 16%, 47%)" fontSize={12} />
                <YAxis 
                  stroke="hsl(215, 16%, 47%)" 
                  fontSize={12}
                  tickFormatter={(value) => `${value / 1000}K`}
                />
                <Tooltip 
                  formatter={(value: number) => [formatFullCurrency(value), 'Disbursed']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(0, 0%, 100%)',
                    border: '1px solid hsl(215, 20%, 88%)',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="hsl(173, 58%, 39%)" 
                  strokeWidth={2}
                  fill="url(#colorAmount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Collection Trend */}
        <div className="rounded-xl border border-border bg-card p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-lg font-semibold mb-4">Collection Performance</h2>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={collections}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 88%)" />
                <XAxis dataKey="month" stroke="hsl(215, 16%, 47%)" fontSize={12} />
                <YAxis 
                  stroke="hsl(215, 16%, 47%)" 
                  fontSize={12}
                  tickFormatter={(value) => `${value / 1000}K`}
                />
                <Tooltip 
                  formatter={(value: number) => formatFullCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: 'hsl(0, 0%, 100%)',
                    border: '1px solid hsl(215, 20%, 88%)',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="collected" name="Collected" fill="hsl(173, 58%, 39%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expected" name="Expected" fill="hsl(222, 47%, 20%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Portfolio Distribution */}
        <div className="rounded-xl border border-border bg-card p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-lg font-semibold mb-4">Loan Portfolio</h2>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={portfolio}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {portfolio.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatFullCurrency(value)}
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
            {portfolio.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="h-3 w-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-medium">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Loan Status Distribution */}
        <div className="rounded-xl border border-border bg-card p-6 animate-slide-up" style={{ animationDelay: '0.25s' }}>
          <h2 className="text-lg font-semibold mb-4">Loan Status</h2>
          <div className="h-[200px]">
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
        </div>

        {/* Quick Stats */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Pending Applications</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/applications">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="space-y-3">
            {pendingApps.slice(0, 3).map((app) => (
              <div 
                key={app.id}
                className="flex items-center justify-between rounded-lg border border-border p-4"
              >
                <div>
                  <p className="font-medium">{app.clientName}</p>
                  <p className="text-sm text-muted-foreground">
                    {app.product} · {formatFullCurrency(app.amount)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{app.appliedDate}</p>
                  <Link 
                    to="/admin/applications" 
                    className="text-sm font-medium text-accent hover:underline"
                  >
                    Review
                  </Link>
                </div>
              </div>
            ))}
            {pendingApps.length === 0 && (
              <p className="text-center py-8 text-muted-foreground">
                No pending applications
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
