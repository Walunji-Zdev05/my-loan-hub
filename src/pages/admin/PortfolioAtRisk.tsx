import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/shared/StatCard';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { AlertTriangle, TrendingDown, Clock, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

// Fake PAR data with various overdue statuses
const parLoans = [
  { id: 'LN001', clientName: 'John Doe', loanAmount: 50000, outstandingBalance: 35000, daysOverdue: 5, overdueAmount: 2500 },
  { id: 'LN002', clientName: 'Jane Smith', loanAmount: 75000, outstandingBalance: 45000, daysOverdue: 15, overdueAmount: 4500 },
  { id: 'LN003', clientName: 'Robert Johnson', loanAmount: 100000, outstandingBalance: 80000, daysOverdue: 25, overdueAmount: 8000 },
  { id: 'LN004', clientName: 'Emily Davis', loanAmount: 30000, outstandingBalance: 20000, daysOverdue: 35, overdueAmount: 3000 },
  { id: 'LN005', clientName: 'Michael Wilson', loanAmount: 60000, outstandingBalance: 50000, daysOverdue: 45, overdueAmount: 6000 },
  { id: 'LN006', clientName: 'Sarah Brown', loanAmount: 85000, outstandingBalance: 70000, daysOverdue: 55, overdueAmount: 9000 },
  { id: 'LN007', clientName: 'David Lee', loanAmount: 45000, outstandingBalance: 40000, daysOverdue: 70, overdueAmount: 7000 },
  { id: 'LN008', clientName: 'Lisa Anderson', loanAmount: 120000, outstandingBalance: 95000, daysOverdue: 90, overdueAmount: 15000 },
  { id: 'LN009', clientName: 'James Taylor', loanAmount: 55000, outstandingBalance: 30000, daysOverdue: 120, overdueAmount: 12000 },
];

// Non-overdue loans for total portfolio calculation
const performingLoans = [
  { id: 'LN010', clientName: 'Chris Martin', loanAmount: 80000, outstandingBalance: 60000 },
  { id: 'LN011', clientName: 'Amanda White', loanAmount: 95000, outstandingBalance: 75000 },
  { id: 'LN012', clientName: 'Kevin Harris', loanAmount: 40000, outstandingBalance: 25000 },
  { id: 'LN013', clientName: 'Rachel Green', loanAmount: 70000, outstandingBalance: 55000 },
  { id: 'LN014', clientName: 'Tom Baker', loanAmount: 65000, outstandingBalance: 45000 },
];

const getBucket = (daysOverdue: number): string => {
  if (daysOverdue <= 30) return '1-30 days';
  if (daysOverdue <= 60) return '31-60 days';
  return '61+ days';
};

const getBucketColor = (bucket: string): string => {
  switch (bucket) {
    case '1-30 days': return 'hsl(48, 96%, 53%)'; // warning yellow
    case '31-60 days': return 'hsl(25, 95%, 53%)'; // orange
    case '61+ days': return 'hsl(0, 84%, 60%)'; // destructive red
    default: return 'hsl(var(--muted))';
  }
};

export default function PortfolioAtRisk() {
  // Calculate totals
  const totalPortfolio = [...parLoans, ...performingLoans].reduce((sum, loan) => sum + loan.outstandingBalance, 0);
  const totalAtRisk = parLoans.reduce((sum, loan) => sum + loan.outstandingBalance, 0);
  const totalOverdueAmount = parLoans.reduce((sum, loan) => sum + loan.overdueAmount, 0);

  // Group by buckets
  const bucket1to30 = parLoans.filter(l => l.daysOverdue >= 1 && l.daysOverdue <= 30);
  const bucket31to60 = parLoans.filter(l => l.daysOverdue >= 31 && l.daysOverdue <= 60);
  const bucket61plus = parLoans.filter(l => l.daysOverdue > 60);

  const bucket1to30Amount = bucket1to30.reduce((sum, l) => sum + l.outstandingBalance, 0);
  const bucket31to60Amount = bucket31to60.reduce((sum, l) => sum + l.outstandingBalance, 0);
  const bucket61plusAmount = bucket61plus.reduce((sum, l) => sum + l.outstandingBalance, 0);

  // Calculate PAR percentages
  const par1to30 = ((bucket1to30Amount / totalPortfolio) * 100).toFixed(2);
  const par31to60 = ((bucket31to60Amount / totalPortfolio) * 100).toFixed(2);
  const par61plus = ((bucket61plusAmount / totalPortfolio) * 100).toFixed(2);
  const totalPAR = ((totalAtRisk / totalPortfolio) * 100).toFixed(2);

  // Pie chart data
  const pieData = [
    { name: 'PAR 1-30 days', value: bucket1to30Amount, count: bucket1to30.length },
    { name: 'PAR 31-60 days', value: bucket31to60Amount, count: bucket31to60.length },
    { name: 'PAR 61+ days', value: bucket61plusAmount, count: bucket61plus.length },
  ];

  const COLORS = [
    'hsl(48, 96%, 53%)',  // warning yellow
    'hsl(25, 95%, 53%)',  // orange
    'hsl(0, 84%, 60%)',   // red
  ];

  const columns = [
    { key: 'clientName', header: 'Client Name', cell: (item: typeof parLoans[0]) => <span className="font-medium">{item.clientName}</span> },
    { key: 'loanId', header: 'Loan ID', cell: (item: typeof parLoans[0]) => <span className="text-muted-foreground">{item.id}</span> },
    { key: 'loanAmount', header: 'Loan Amount', cell: (item: typeof parLoans[0]) => `KES ${item.loanAmount.toLocaleString()}` },
    { key: 'outstandingBalance', header: 'Outstanding', cell: (item: typeof parLoans[0]) => `KES ${item.outstandingBalance.toLocaleString()}` },
    { key: 'daysOverdue', header: 'Days Overdue', cell: (item: typeof parLoans[0]) => (
      <span className="font-semibold text-destructive">{item.daysOverdue}</span>
    )},
    { key: 'overdueAmount', header: 'Overdue Amount', cell: (item: typeof parLoans[0]) => (
      <span className="text-destructive font-medium">KES {item.overdueAmount.toLocaleString()}</span>
    )},
    { key: 'bucket', header: 'Bucket', cell: (item: typeof parLoans[0]) => {
      const bucket = getBucket(item.daysOverdue);
      return (
        <span 
          className="px-2 py-1 rounded-full text-xs font-medium"
          style={{ 
            backgroundColor: `${getBucketColor(bucket)}20`,
            color: getBucketColor(bucket)
          }}
        >
          {bucket}
        </span>
      );
    }},
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">Amount: KES {data.value.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Loans: {data.count}</p>
          <p className="text-sm text-muted-foreground">% of Portfolio: {((data.value / totalPortfolio) * 100).toFixed(2)}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Portfolio at Risk (PAR)</h1>
        <p className="text-muted-foreground">Overview of overdue loans and risk exposure</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total PAR %"
          value={`${totalPAR}%`}
          icon={<AlertTriangle className="h-5 w-5" />}
          trend={{ value: 2.3, label: 'vs last month' }}
          className="border-l-4 border-l-destructive"
        />
        <StatCard
          title="PAR 1-30 Days"
          value={`${par1to30}%`}
          icon={<Clock className="h-5 w-5" />}
          subtitle={`${bucket1to30.length} loans`}
          className="border-l-4 border-l-yellow-500"
        />
        <StatCard
          title="PAR 31-60 Days"
          value={`${par31to60}%`}
          icon={<AlertCircle className="h-5 w-5" />}
          subtitle={`${bucket31to60.length} loans`}
          className="border-l-4 border-l-orange-500"
        />
        <StatCard
          title="PAR 61+ Days"
          value={`${par61plus}%`}
          icon={<TrendingDown className="h-5 w-5" />}
          subtitle={`${bucket61plus.length} loans`}
          className="border-l-4 border-l-red-500"
        />
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Portfolio</p>
              <p className="text-2xl font-bold text-foreground">KES {totalPortfolio.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">{parLoans.length + performingLoans.length} active loans</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Portfolio at Risk</p>
              <p className="text-2xl font-bold text-destructive">KES {totalAtRisk.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">{parLoans.length} overdue loans</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Overdue Amount</p>
              <p className="text-2xl font-bold text-destructive">KES {totalOverdueAmount.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Arrears across all buckets</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pie Chart and Bucket Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              PAR Distribution by Bucket
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bucket Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: '1-30 Days', amount: bucket1to30Amount, count: bucket1to30.length, par: par1to30, color: 'bg-yellow-500' },
                { label: '31-60 Days', amount: bucket31to60Amount, count: bucket31to60.length, par: par31to60, color: 'bg-orange-500' },
                { label: '61+ Days', amount: bucket61plusAmount, count: bucket61plus.length, par: par61plus, color: 'bg-red-500' },
              ].map((bucket) => (
                <div key={bucket.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${bucket.color}`} />
                      <span className="font-medium text-foreground">{bucket.label}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{bucket.count} loans</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">KES {bucket.amount.toLocaleString()}</span>
                    <span className="font-semibold text-foreground">{bucket.par}% of portfolio</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`${bucket.color} h-2 rounded-full transition-all`} 
                      style={{ width: `${Math.min(parseFloat(bucket.par) * 5, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loans Table */}
      <Card>
        <CardHeader>
          <CardTitle>Overdue Loans Detail</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={parLoans} emptyMessage="No overdue loans" />
        </CardContent>
      </Card>
    </div>
  );
}
