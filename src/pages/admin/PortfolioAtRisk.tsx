import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/shared/StatCard';
import { DataTable } from '@/components/shared/DataTable';
import { AlertTriangle, TrendingDown, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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

// Non-overdue loans (Active/Performing) for total portfolio calculation
const performingLoans = [
  { id: 'LN010', clientName: 'Chris Martin', loanAmount: 80000, outstandingBalance: 60000 },
  { id: 'LN011', clientName: 'Amanda White', loanAmount: 95000, outstandingBalance: 75000 },
  { id: 'LN012', clientName: 'Kevin Harris', loanAmount: 40000, outstandingBalance: 25000 },
  { id: 'LN013', clientName: 'Rachel Green', loanAmount: 70000, outstandingBalance: 55000 },
  { id: 'LN014', clientName: 'Tom Baker', loanAmount: 65000, outstandingBalance: 45000 },
  { id: 'LN015', clientName: 'Nancy Drew', loanAmount: 110000, outstandingBalance: 90000 },
  { id: 'LN016', clientName: 'Mark Spencer', loanAmount: 85000, outstandingBalance: 70000 },
  { id: 'LN017', clientName: 'Julie Chen', loanAmount: 55000, outstandingBalance: 40000 },
  { id: 'LN018', clientName: 'Brian Moore', loanAmount: 120000, outstandingBalance: 100000 },
  { id: 'LN019', clientName: 'Emma Watson', loanAmount: 75000, outstandingBalance: 65000 },
  { id: 'LN020', clientName: 'Daniel Craig', loanAmount: 90000, outstandingBalance: 80000 },
  { id: 'LN021', clientName: 'Sophie Turner', loanAmount: 45000, outstandingBalance: 35000 },
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
  const performingAmount = performingLoans.reduce((sum, loan) => sum + loan.outstandingBalance, 0);
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
  const performingPercent = ((performingAmount / totalPortfolio) * 100).toFixed(2);
  const par1to30 = ((bucket1to30Amount / totalPortfolio) * 100).toFixed(2);
  const par31to60 = ((bucket31to60Amount / totalPortfolio) * 100).toFixed(2);
  const par61plus = ((bucket61plusAmount / totalPortfolio) * 100).toFixed(2);
  const totalPAR = ((totalAtRisk / totalPortfolio) * 100).toFixed(2);

  // Full Portfolio Distribution Pie Chart Data (including performing loans)
  const portfolioDistributionData = [
    { name: 'Active/Performing Loans', value: performingAmount, count: performingLoans.length },
    { name: 'PAR 1-30 days', value: bucket1to30Amount, count: bucket1to30.length },
    { name: 'PAR 31-60 days', value: bucket31to60Amount, count: bucket31to60.length },
    { name: 'PAR 61+ days', value: bucket61plusAmount, count: bucket61plus.length },
  ];

  const PORTFOLIO_COLORS = [
    'hsl(142, 71%, 45%)',  // green for performing
    'hsl(48, 96%, 53%)',   // warning yellow
    'hsl(25, 95%, 53%)',   // orange
    'hsl(0, 84%, 60%)',    // red
  ];

  // Bucket breakdown table data (including active loans)
  const bucketTableData = [
    { 
      bucket: 'Active/Performing', 
      daysOverdue: '0 days', 
      amount: performingAmount, 
      percentage: performingPercent, 
      loanCount: performingLoans.length,
      color: 'bg-green-500'
    },
    { 
      bucket: 'PAR 1-30 Days', 
      daysOverdue: '1-30 days', 
      amount: bucket1to30Amount, 
      percentage: par1to30, 
      loanCount: bucket1to30.length,
      color: 'bg-yellow-500'
    },
    { 
      bucket: 'PAR 31-60 Days', 
      daysOverdue: '31-60 days', 
      amount: bucket31to60Amount, 
      percentage: par31to60, 
      loanCount: bucket31to60.length,
      color: 'bg-orange-500'
    },
    { 
      bucket: 'PAR 61+ Days', 
      daysOverdue: '61+ days', 
      amount: bucket61plusAmount, 
      percentage: par61plus, 
      loanCount: bucket61plus.length,
      color: 'bg-red-500'
    },
  ];

  const columns = [
    { key: 'clientName', header: 'Client Name', cell: (item: typeof parLoans[0]) => <span className="font-medium">{item.clientName}</span> },
    { key: 'loanId', header: 'Loan ID', cell: (item: typeof parLoans[0]) => <span className="text-muted-foreground">{item.id}</span> },
    { key: 'loanAmount', header: 'Loan Amount', cell: (item: typeof parLoans[0]) => `K${item.loanAmount.toLocaleString()}` },
    { key: 'outstandingBalance', header: 'Outstanding', cell: (item: typeof parLoans[0]) => `K${item.outstandingBalance.toLocaleString()}` },
    { key: 'daysOverdue', header: 'Days Overdue', cell: (item: typeof parLoans[0]) => (
      <span className="font-semibold text-destructive">{item.daysOverdue}</span>
    )},
    { key: 'overdueAmount', header: 'Overdue Amount', cell: (item: typeof parLoans[0]) => (
      <span className="text-destructive font-medium">K{item.overdueAmount.toLocaleString()}</span>
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
          <p className="text-sm text-muted-foreground">Amount: K{data.value.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Loans: {data.count}</p>
          <p className="text-sm text-muted-foreground">% of Portfolio: {((data.value / totalPortfolio) * 100).toFixed(2)}%</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show label for very small slices

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Portfolio at Risk (PAR)</h1>
        <p className="text-muted-foreground">Overview of portfolio distribution and risk exposure</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Active/Performing"
          value={`${performingPercent}%`}
          icon={<CheckCircle className="h-5 w-5" />}
          subtitle={`${performingLoans.length} loans`}
          className="border-l-4 border-l-green-500"
        />
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
              <p className="text-2xl font-bold text-foreground">K{totalPortfolio.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">{parLoans.length + performingLoans.length} active loans</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Portfolio at Risk</p>
              <p className="text-2xl font-bold text-destructive">K{totalAtRisk.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">{parLoans.length} overdue loans</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Overdue Amount</p>
              <p className="text-2xl font-bold text-destructive">K{totalOverdueAmount.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Arrears across all buckets</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full Portfolio Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Full Portfolio Distribution by Bucket
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Donut Chart */}
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={portfolioDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={120}
                    paddingAngle={3}
                    dataKey="value"
                    labelLine={false}
                    label={renderCustomizedLabel}
                  >
                    {portfolioDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PORTFOLIO_COLORS[index % PORTFOLIO_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value, entry: any) => (
                      <span className="text-sm text-foreground">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bucket Details Table */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Bucket Details</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bucket</TableHead>
                    <TableHead>Days Overdue</TableHead>
                    <TableHead className="text-right">Amount (K)</TableHead>
                    <TableHead className="text-right">% of Portfolio</TableHead>
                    <TableHead className="text-right"># Loans</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bucketTableData.map((row) => (
                    <TableRow key={row.bucket}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${row.color}`} />
                          <span className="font-medium">{row.bucket}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{row.daysOverdue}</TableCell>
                      <TableCell className="text-right font-medium">K{row.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-semibold">{row.percentage}%</TableCell>
                      <TableCell className="text-right">{row.loanCount}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell colSpan={2}>Total Portfolio</TableCell>
                    <TableCell className="text-right">K{totalPortfolio.toLocaleString()}</TableCell>
                    <TableCell className="text-right">100%</TableCell>
                    <TableCell className="text-right">{parLoans.length + performingLoans.length}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

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
