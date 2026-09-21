import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/shared/DataTable';
import { StatCard } from '@/components/shared/StatCard';
import { Calendar, DollarSign, TrendingUp, Clock, FileDown, Loader2, Wifi } from 'lucide-react';
import { format, addDays, isWithinInterval, startOfToday } from 'date-fns';
import { useLoans, LoanWithDetails } from '@/hooks/useLoans';
import { useRealtimeExpectedLoans } from '@/hooks/useRealtimeLoans';
import { useUpcomingInstallments } from '@/hooks/useLoanSchedule';

type DateFilter = '7' | '30' | '60' | '90' | 'all';

function ExpectedLoans() {
  const [dateFilter, setDateFilter] = useState<DateFilter>('30');
  const today = startOfToday();

  // Enable real-time subscriptions for expected loans
  useRealtimeExpectedLoans();

  const { data: approvedLoans, isLoading: approvedLoading } = useLoans('approved');
  const { data: activeLoans, isLoading: activeLoading } = useLoans(['active', 'disbursed']);
  
  // Get scheduled installments from loan_schedule table (for 90+ days)
  const { data: scheduledInstallments, isLoading: scheduleLoading } = useUpcomingInstallments(365);

  const isLoading = approvedLoading || activeLoading || scheduleLoading;

  // Use loan_schedule if available, otherwise fall back to calculated projections
  const expectedRepayments = useMemo(() => {
    // If we have scheduled installments from loan_schedule, use those
    if (scheduledInstallments && scheduledInstallments.length > 0) {
      console.log('📅 Using loan_schedule data:', scheduledInstallments.length, 'installments');
      return scheduledInstallments.map(installment => ({
        id: installment.id,
        date: new Date(installment.due_date),
        clientId: installment.loans?.clients?.client_number || '',
        clientName: installment.loans?.clients ? 
          `${installment.loans.clients.first_name} ${installment.loans.clients.last_name}` : 'Unknown',
        amount: Number(installment.total_amount),
        principalPortion: Number(installment.principal_portion),
        interestPortion: Number(installment.interest_portion),
        type: 'Repayment',
        loanId: installment.loans?.loan_number || '',
        installmentNumber: installment.installment_number,
        status: installment.status,
      })).sort((a, b) => a.date.getTime() - b.date.getTime());
    }
    
    // Fallback: Generate projections from active loans (for loans without schedule)
    if (!activeLoans) return [];
    console.log('📅 Using projected data for', activeLoans.length, 'active loans');
    
    const repayments: Array<{
      id: string;
      date: Date;
      clientId: string;
      clientName: string;
      amount: number;
      principalPortion: number;
      interestPortion: number;
      type: string;
      loanId: string;
      installmentNumber: number;
      status: string;
    }> = [];
    
    activeLoans.forEach(loan => {
      if (!loan.next_payment_date) return;
      
      const startDate = new Date(loan.next_payment_date);
      const weeklyPayment = Number(loan.monthly_payment); // stores the weekly installment amount
      const remainingWeeks = Math.ceil(Number(loan.outstanding_balance) / weeklyPayment);
      
      // Generate weekly installments for remaining term (up to 52 weeks ahead)
      for (let i = 0; i < Math.min(remainingWeeks, 52); i++) {
        const installmentDate = addDays(startDate, i * 7);
        repayments.push({
          id: `${loan.id}-${i}`,
          date: installmentDate,
          clientId: loan.clients?.client_number || '',
          clientName: `${loan.clients?.first_name || ''} ${loan.clients?.last_name || ''}`,
          amount: weeklyPayment,
          principalPortion: 0,
          interestPortion: 0,
          type: 'Repayment',
          loanId: loan.loan_number,
          installmentNumber: i + 1,
          status: 'projected',
        });
      }
    });
    
    return repayments.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [activeLoans, scheduledInstallments]);

  // Filter by date
  const filterByDate = <T extends { date: Date }>(items: T[]): T[] => {
    if (dateFilter === 'all') return items;
    const days = parseInt(dateFilter);
    const endDate = addDays(today, days);
    return items.filter(item => 
      isWithinInterval(item.date, { start: today, end: endDate })
    );
  };

  const filteredDisbursements = useMemo(() => {
    if (!approvedLoans) return [];
    return approvedLoans.map(loan => ({
      id: loan.id,
      date: new Date(), // Pending disbursement
      clientId: loan.clients?.client_number || '',
      clientName: `${loan.clients?.first_name || ''} ${loan.clients?.last_name || ''}`,
      amount: Number(loan.principal_amount),
      type: 'Disbursement',
      status: 'Approved',
    }));
  }, [approvedLoans]);

  const filteredRepayments = useMemo(() => filterByDate(expectedRepayments), [dateFilter, expectedRepayments]);

  const totalDisbursements = filteredDisbursements.reduce((sum, d) => sum + d.amount, 0);
  const totalRepayments = filteredRepayments.reduce((sum, r) => sum + r.amount, 0);

  const formatCurrency = (amount: number) => `K${amount.toLocaleString()}`;

  const exportToExcel = () => {
    const allData = [
      ...filteredDisbursements.map(d => ({ ...d, category: 'Disbursement' })),
      ...filteredRepayments.map(r => ({ ...r, category: 'Repayment' })),
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    const headers = ['Date', 'Client', 'Amount', 'Type', 'Category'];
    const rows = allData.map(item => [
      format(item.date, 'yyyy-MM-dd'),
      item.clientName,
      item.amount.toString(),
      item.type,
      item.category,
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Expected Loans as of ${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const disbursementColumns = [
    { key: 'date', header: 'Date', cell: (item: typeof filteredDisbursements[0]) => format(item.date, 'MMM dd, yyyy') },
    { key: 'clientId', header: 'Client ID', cell: (item: typeof filteredDisbursements[0]) => (
      <span className="font-mono text-xs text-muted-foreground">{item.clientId}</span>
    )},
    { key: 'client', header: 'Client Name', cell: (item: typeof filteredDisbursements[0]) => item.clientName },
    { key: 'amount', header: 'Amount', cell: (item: typeof filteredDisbursements[0]) => formatCurrency(item.amount) },
    { key: 'type', header: 'Type', cell: () => (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
        Disbursement
      </span>
    )},
    { key: 'status', header: 'Status', cell: () => (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground">
        Approved
      </span>
    )},
  ];

  const repaymentColumns = [
    { key: 'date', header: 'Due Date', cell: (item: typeof filteredRepayments[0]) => format(item.date, 'MMM dd, yyyy') },
    { key: 'clientId', header: 'Client ID', cell: (item: typeof filteredRepayments[0]) => (
      <span className="font-mono text-xs text-muted-foreground">{item.clientId}</span>
    )},
    { key: 'client', header: 'Client Name', cell: (item: typeof filteredRepayments[0]) => item.clientName },
    { key: 'principal', header: 'Principal', cell: (item: typeof filteredRepayments[0]) => (
      <span className="text-xs">{item.principalPortion > 0 ? formatCurrency(item.principalPortion) : '-'}</span>
    )},
    { key: 'interest', header: 'Interest', cell: (item: typeof filteredRepayments[0]) => (
      <span className="text-xs text-muted-foreground">{item.interestPortion > 0 ? formatCurrency(item.interestPortion) : '-'}</span>
    )},
    { key: 'amount', header: 'Total', cell: (item: typeof filteredRepayments[0]) => (
      <span className="font-medium">{formatCurrency(item.amount)}</span>
    )},
    { key: 'installment', header: 'Installment', cell: (item: typeof filteredRepayments[0]) => (
      <span className="text-xs text-muted-foreground">#{item.installmentNumber}</span>
    )},
    { key: 'status', header: 'Status', cell: (item: typeof filteredRepayments[0]) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        item.status === 'scheduled' ? 'bg-primary/10 text-primary' : 
        item.status === 'projected' ? 'bg-muted text-muted-foreground' :
        'bg-secondary text-secondary-foreground'
      }`}>
        {item.status === 'scheduled' ? 'Scheduled' : item.status === 'projected' ? 'Projected' : item.status}
      </span>
    )},
    { key: 'loanId', header: 'Loan ID', cell: (item: typeof filteredRepayments[0]) => (
      <span className="font-mono text-xs">{item.loanId}</span>
    )},
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Expected Loans</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Upcoming disbursements and expected repayments</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Wifi className="h-3 w-3 text-green-500 animate-pulse" />
            <span>Live updates</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={dateFilter} onValueChange={(value: DateFilter) => setDateFilter(value)}>
            <SelectTrigger className="w-full sm:w-[150px] h-10 sm:h-9">
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Next 7 days</SelectItem>
              <SelectItem value="30">Next 30 days</SelectItem>
              <SelectItem value="60">Next 60 days</SelectItem>
              <SelectItem value="90">Next 90 days</SelectItem>
              <SelectItem value="all">All upcoming</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportToExcel} variant="outline" className="h-10 sm:h-9 w-full sm:w-auto">
            <FileDown className="h-4 w-4 mr-2" />
            Export to Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
        <StatCard
          title="Pending Disbursements"
          value={formatCurrency(totalDisbursements)}
          subtitle={`${filteredDisbursements.length} pending`}
          icon={<DollarSign className="h-5 w-5" />}
          variant="primary"
        />
        <StatCard
          title="Expected Repayments"
          value={formatCurrency(totalRepayments)}
          subtitle={`${filteredRepayments.length} upcoming`}
          icon={<Clock className="h-5 w-5" />}
          variant="accent"
        />
        <StatCard
          title="Net Cash Flow"
          value={formatCurrency(totalRepayments - totalDisbursements)}
          subtitle="Repayments - Disbursements"
          icon={<TrendingUp className="h-5 w-5" />}
          variant="default"
        />
      </div>

      {/* Pending Disbursements Table */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <DollarSign className="h-5 w-5 text-primary" />
            Pending Disbursements
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          <DataTable
            columns={disbursementColumns}
            data={filteredDisbursements}
            emptyMessage="No pending disbursements"
          />
        </CardContent>
      </Card>

      {/* Expected Repayments Table */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calendar className="h-5 w-5 text-purple-500" />
            Expected Repayments
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          <DataTable
            columns={repaymentColumns}
            data={filteredRepayments}
            emptyMessage="No expected repayments in selected period"
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default ExpectedLoans;
