import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/shared/DataTable';
import { StatCard } from '@/components/shared/StatCard';
import { Calendar, DollarSign, TrendingUp, Clock, FileDown } from 'lucide-react';
import { format, addDays, isWithinInterval, startOfToday } from 'date-fns';
import { useLoans, LoanWithDetails } from '@/hooks/useLoans';

type DateFilter = '7' | '30' | '60' | 'all';

function ExpectedLoans() {
  const [dateFilter, setDateFilter] = useState<DateFilter>('30');
  const today = startOfToday();

  // Get approved loans (pending disbursement)
  const { data: approvedLoans = [], isLoading: approvedLoading } = useLoans('approved');
  // Get active loans (for expected repayments)
  const { data: activeLoans = [], isLoading: activeLoading } = useLoans(['active', 'disbursed']);

  const isLoading = approvedLoading || activeLoading;

  // Generate expected repayments from active loans
  const expectedRepayments = useMemo(() => {
    return activeLoans.map(loan => ({
      id: loan.id,
      date: loan.next_payment_date ? new Date(loan.next_payment_date) : addDays(today, 30),
      clientId: loan.clients.client_number,
      clientName: `${loan.clients.first_name} ${loan.clients.last_name}`,
      amount: Number(loan.monthly_payment),
      type: 'Repayment' as const,
      loanId: loan.loan_number,
    }));
  }, [activeLoans, today]);

  // Generate projected income (interest + fees from new disbursements)
  const projectedIncome = useMemo(() => {
    const income: Array<{
      id: string;
      date: Date;
      clientName: string;
      amount: number;
      type: string;
      loanId: string;
    }> = [];

    // Interest from repayments (simplified - assume 30% of payment is interest)
    activeLoans.forEach(loan => {
      if (loan.next_payment_date) {
        income.push({
          id: `${loan.id}-interest`,
          date: new Date(loan.next_payment_date),
          clientName: `${loan.clients.first_name} ${loan.clients.last_name}`,
          amount: Math.round(Number(loan.monthly_payment) * 0.3),
          type: 'Interest',
          loanId: loan.loan_number,
        });
      }
    });

    // Approval fees from approved loans
    approvedLoans.forEach(loan => {
      income.push({
        id: `${loan.id}-approval`,
        date: addDays(today, 5),
        clientName: `${loan.clients.first_name} ${loan.clients.last_name}`,
        amount: Number(loan.loan_products.approval_fee),
        type: 'Approval Fee',
        loanId: loan.loan_number,
      });
    });

    return income;
  }, [activeLoans, approvedLoans, today]);

  const filterByDate = <T extends { date: Date }>(items: T[]): T[] => {
    if (dateFilter === 'all') return items;
    const days = parseInt(dateFilter);
    const endDate = addDays(today, days);
    return items.filter(item => 
      isWithinInterval(item.date, { start: today, end: endDate })
    );
  };

  const pendingDisbursements = approvedLoans.map(loan => ({
    id: loan.id,
    date: addDays(today, 3),
    clientName: `${loan.clients.first_name} ${loan.clients.last_name}`,
    amount: Number(loan.principal_amount),
    type: 'Disbursement' as const,
    status: 'Approved',
  }));

  const filteredDisbursements = useMemo(() => filterByDate(pendingDisbursements), [pendingDisbursements, dateFilter]);
  const filteredRepayments = useMemo(() => filterByDate(expectedRepayments), [expectedRepayments, dateFilter]);
  const filteredIncome = useMemo(() => filterByDate(projectedIncome), [projectedIncome, dateFilter]);

  const totalDisbursements = filteredDisbursements.reduce((sum, d) => sum + d.amount, 0);
  const totalRepayments = filteredRepayments.reduce((sum, r) => sum + r.amount, 0);
  const totalIncome = filteredIncome.reduce((sum, i) => sum + i.amount, 0);

  const formatCurrency = (amount: number) => `K${amount.toLocaleString()}`;

  const exportToExcel = () => {
    const allData = [
      ...filteredDisbursements.map(d => ({ ...d, category: 'Disbursement' })),
      ...filteredRepayments.map(r => ({ ...r, category: 'Repayment' })),
      ...filteredIncome.map(i => ({ ...i, category: 'Income' })),
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
    { key: 'date', header: 'Date', cell: (item: typeof pendingDisbursements[0]) => format(item.date, 'MMM dd, yyyy') },
    { key: 'client', header: 'Client', cell: (item: typeof pendingDisbursements[0]) => item.clientName },
    { key: 'amount', header: 'Amount', cell: (item: typeof pendingDisbursements[0]) => formatCurrency(item.amount) },
    { key: 'status', header: 'Status', cell: () => (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
        Approved
      </span>
    )},
  ];

  const repaymentColumns = [
    { key: 'date', header: 'Due Date', cell: (item: typeof expectedRepayments[0]) => format(item.date, 'MMM dd, yyyy') },
    { key: 'clientId', header: 'Client ID', cell: (item: typeof expectedRepayments[0]) => <span className="font-mono text-xs text-muted-foreground">{item.clientId}</span> },
    { key: 'client', header: 'Client Name', cell: (item: typeof expectedRepayments[0]) => item.clientName },
    { key: 'amount', header: 'Amount', cell: (item: typeof expectedRepayments[0]) => formatCurrency(item.amount) },
    { key: 'loanId', header: 'Loan ID', cell: (item: typeof expectedRepayments[0]) => item.loanId },
  ];

  const incomeColumns = [
    { key: 'date', header: 'Date', cell: (item: typeof projectedIncome[0]) => format(item.date, 'MMM dd, yyyy') },
    { key: 'client', header: 'Client', cell: (item: typeof projectedIncome[0]) => item.clientName },
    { key: 'amount', header: 'Amount', cell: (item: typeof projectedIncome[0]) => formatCurrency(item.amount) },
    { key: 'type', header: 'Type', cell: (item: typeof projectedIncome[0]) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        item.type === 'Interest' 
          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
          : 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400'
      }`}>
        {item.type}
      </span>
    )},
    { key: 'loanId', header: 'Loan ID', cell: (item: typeof projectedIncome[0]) => item.loanId },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Expected Loans</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Upcoming disbursements, repayments, and projected income</p>
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
        <StatCard title="Expected Disbursements" value={formatCurrency(totalDisbursements)} subtitle={`${filteredDisbursements.length} pending`} icon={<DollarSign className="h-5 w-5" />} variant="primary" />
        <StatCard title="Expected Repayments" value={formatCurrency(totalRepayments)} subtitle={`${filteredRepayments.length} upcoming`} icon={<Clock className="h-5 w-5" />} variant="accent" />
        <StatCard title="Projected Income" value={formatCurrency(totalIncome)} subtitle={`Interest + fees`} icon={<TrendingUp className="h-5 w-5" />} variant="default" />
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
          <DataTable columns={disbursementColumns} data={filteredDisbursements} emptyMessage="No pending disbursements" />
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
          <DataTable columns={repaymentColumns} data={filteredRepayments} emptyMessage="No expected repayments" />
        </CardContent>
      </Card>

      {/* Projected Income Table */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <TrendingUp className="h-5 w-5 text-amber-500" />
            Projected Income
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          <DataTable columns={incomeColumns} data={filteredIncome} emptyMessage="No projected income" />
        </CardContent>
      </Card>
    </div>
  );
}

export default ExpectedLoans;
