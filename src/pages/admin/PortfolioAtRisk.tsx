import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/shared/StatCard';
import { DataTable } from '@/components/shared/DataTable';
import { AlertTriangle, TrendingDown, Clock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLoans, LoanWithDetails } from '@/hooks/useLoans';

const getBucket = (loan: LoanWithDetails): string => {
  if (loan.status !== 'overdue') return 'Active';
  
  // Calculate days overdue based on next_payment_date
  if (!loan.next_payment_date) return '1-30 days';
  
  const dueDate = new Date(loan.next_payment_date);
  const today = new Date();
  const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysOverdue <= 30) return '1-30 days';
  if (daysOverdue <= 60) return '31-60 days';
  return '61+ days';
};

const getBucketColor = (bucket: string): string => {
  switch (bucket) {
    case 'Active': return 'hsl(142, 71%, 45%)';
    case '1-30 days': return 'hsl(48, 96%, 53%)';
    case '31-60 days': return 'hsl(25, 95%, 53%)';
    case '61+ days': return 'hsl(0, 84%, 60%)';
    default: return 'hsl(var(--muted))';
  }
};

export default function PortfolioAtRisk() {
  const { data: activeLoans, isLoading: activeLoading } = useLoans(['active', 'disbursed']);
  const { data: overdueLoans, isLoading: overdueLoading } = useLoans('overdue');
  
  const isLoading = activeLoading || overdueLoading;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const performingLoans = activeLoans || [];
  const parLoans = overdueLoans || [];
  
  // Calculate totals
  const performingAmount = performingLoans.reduce((sum, loan) => sum + Number(loan.outstanding_balance), 0);
  const totalPortfolio = [...parLoans, ...performingLoans].reduce((sum, loan) => sum + Number(loan.outstanding_balance), 0);
  const totalAtRisk = parLoans.reduce((sum, loan) => sum + Number(loan.outstanding_balance), 0);

  // Group overdue loans by buckets
  const bucket1to30 = parLoans.filter(l => getBucket(l) === '1-30 days');
  const bucket31to60 = parLoans.filter(l => getBucket(l) === '31-60 days');
  const bucket61plus = parLoans.filter(l => getBucket(l) === '61+ days');

  const bucket1to30Amount = bucket1to30.reduce((sum, l) => sum + Number(l.outstanding_balance), 0);
  const bucket31to60Amount = bucket31to60.reduce((sum, l) => sum + Number(l.outstanding_balance), 0);
  const bucket61plusAmount = bucket61plus.reduce((sum, l) => sum + Number(l.outstanding_balance), 0);

  // Calculate PAR percentages
  const performingPercent = totalPortfolio > 0 ? ((performingAmount / totalPortfolio) * 100).toFixed(2) : '0';
  const par1to30 = totalPortfolio > 0 ? ((bucket1to30Amount / totalPortfolio) * 100).toFixed(2) : '0';
  const par31to60 = totalPortfolio > 0 ? ((bucket31to60Amount / totalPortfolio) * 100).toFixed(2) : '0';
  const par61plus = totalPortfolio > 0 ? ((bucket61plusAmount / totalPortfolio) * 100).toFixed(2) : '0';
  const totalPAR = totalPortfolio > 0 ? ((totalAtRisk / totalPortfolio) * 100).toFixed(2) : '0';

  // Portfolio Distribution Pie Chart Data
  const portfolioDistributionData = [
    { name: 'Active/Performing', value: performingAmount, count: performingLoans.length },
    { name: 'PAR 1-30 days', value: bucket1to30Amount, count: bucket1to30.length },
    { name: 'PAR 31-60 days', value: bucket31to60Amount, count: bucket31to60.length },
    { name: 'PAR 61+ days', value: bucket61plusAmount, count: bucket61plus.length },
  ].filter(item => item.value > 0);

  const PORTFOLIO_COLORS = [
    'hsl(142, 71%, 45%)',
    'hsl(48, 96%, 53%)',
    'hsl(25, 95%, 53%)',
    'hsl(0, 84%, 60%)',
  ];

  // Bucket breakdown table data
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
    { 
      key: 'clientName', 
      header: 'Client Name', 
      cell: (loan: LoanWithDetails) => (
        <span className="font-medium">{loan.clients?.first_name} {loan.clients?.last_name}</span>
      )
    },
    { 
      key: 'loanId', 
      header: 'Loan ID', 
      cell: (loan: LoanWithDetails) => (
        <span className="text-muted-foreground font-mono text-xs">{loan.loan_number}</span>
      )
    },
    { 
      key: 'loanAmount', 
      header: 'Principal', 
      cell: (loan: LoanWithDetails) => `K${Number(loan.principal_amount).toLocaleString()}`,
      hideOnMobile: true,
    },
    { 
      key: 'outstandingBalance', 
      header: 'Outstanding', 
      cell: (loan: LoanWithDetails) => `K${Number(loan.outstanding_balance).toLocaleString()}`
    },
    { 
      key: 'bucket', 
      header: 'Bucket', 
      cell: (loan: LoanWithDetails) => {
        const bucket = getBucket(loan);
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
      }
    },
  ];

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; value: number; count: number } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">Amount: K{data.value.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Loans: {data.count}</p>
          <p className="text-sm text-muted-foreground">% of Portfolio: {totalPortfolio > 0 ? ((data.value / totalPortfolio) * 100).toFixed(2) : 0}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Portfolio at Risk (PAR)</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Overview of portfolio distribution and risk exposure</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
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
      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
        <Card className="p-4 sm:p-0">
          <CardContent className="p-0 sm:pt-6 sm:p-6">
            <div className="text-center">
              <p className="text-xs sm:text-sm text-muted-foreground">Total Portfolio</p>
              <p className="text-lg sm:text-2xl font-bold text-foreground">K{totalPortfolio.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">{parLoans.length + performingLoans.length} active loans</p>
            </div>
          </CardContent>
        </Card>
        <Card className="p-4 sm:p-0">
          <CardContent className="p-0 sm:pt-6 sm:p-6">
            <div className="text-center">
              <p className="text-xs sm:text-sm text-muted-foreground">Portfolio at Risk</p>
              <p className="text-lg sm:text-2xl font-bold text-destructive">K{totalAtRisk.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">{parLoans.length} overdue loans</p>
            </div>
          </CardContent>
        </Card>
        <Card className="p-4 sm:p-0">
          <CardContent className="p-0 sm:pt-6 sm:p-6">
            <div className="text-center">
              <p className="text-xs sm:text-sm text-muted-foreground">Performing</p>
              <p className="text-lg sm:text-2xl font-bold text-success">K{performingAmount.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">{performingLoans.length} active loans</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Distribution Chart */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Portfolio Distribution by Bucket
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Donut Chart */}
            <div className="h-[280px] sm:h-[350px] p-4 sm:p-0">
              {portfolioDistributionData.length > 0 ? (
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
                    >
                      {portfolioDistributionData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PORTFOLIO_COLORS[index % PORTFOLIO_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No portfolio data available
                </div>
              )}
            </div>

            {/* Bucket Details Table */}
            <div className="overflow-x-auto p-4 sm:p-0">
              <h3 className="text-sm font-semibold text-foreground mb-3">Bucket Details</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bucket</TableHead>
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
                      <TableCell className="text-right font-medium">K{row.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-semibold">{row.percentage}%</TableCell>
                      <TableCell className="text-right">{row.loanCount}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell>Total Portfolio</TableCell>
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

      {/* Overdue Loans Table */}
      {parLoans.length > 0 && (
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Overdue Loans Detail</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <DataTable columns={columns} data={parLoans} emptyMessage="No overdue loans" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
