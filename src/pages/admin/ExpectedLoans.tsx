import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/shared/DataTable';
import { StatCard } from '@/components/shared/StatCard';
import { Calendar, DollarSign, TrendingUp, Clock, FileDown } from 'lucide-react';
import { format, addDays, isWithinInterval, startOfToday } from 'date-fns';

// Fake future data for demo
const generateFakeData = () => {
  const today = startOfToday();
  
  const pendingDisbursements = [
    { id: 'DIS-001', date: addDays(today, 2), clientName: 'John Kamau', amount: 50000, type: 'Disbursement', status: 'Approved' },
    { id: 'DIS-002', date: addDays(today, 5), clientName: 'Mary Wanjiku', amount: 75000, type: 'Disbursement', status: 'Approved' },
    { id: 'DIS-003', date: addDays(today, 7), clientName: 'Peter Ochieng', amount: 100000, type: 'Disbursement', status: 'Approved' },
    { id: 'DIS-004', date: addDays(today, 10), clientName: 'Grace Muthoni', amount: 30000, type: 'Disbursement', status: 'Approved' },
    { id: 'DIS-005', date: addDays(today, 15), clientName: 'James Njoroge', amount: 45000, type: 'Disbursement', status: 'Approved' },
    { id: 'DIS-006', date: addDays(today, 20), clientName: 'Faith Akinyi', amount: 80000, type: 'Disbursement', status: 'Approved' },
  ];

  const expectedRepayments = [
    { id: 'REP-001', date: addDays(today, 3), clientName: 'Samuel Kipchoge', amount: 5500, type: 'Repayment', loanId: 'LN-1001' },
    { id: 'REP-002', date: addDays(today, 5), clientName: 'Alice Wambui', amount: 8200, type: 'Repayment', loanId: 'LN-1002' },
    { id: 'REP-003', date: addDays(today, 8), clientName: 'Daniel Mwangi', amount: 12000, type: 'Repayment', loanId: 'LN-1003' },
    { id: 'REP-004', date: addDays(today, 12), clientName: 'Rose Atieno', amount: 6800, type: 'Repayment', loanId: 'LN-1004' },
    { id: 'REP-005', date: addDays(today, 15), clientName: 'Michael Otieno', amount: 15000, type: 'Repayment', loanId: 'LN-1005' },
    { id: 'REP-006', date: addDays(today, 18), clientName: 'Elizabeth Njeri', amount: 9500, type: 'Repayment', loanId: 'LN-1006' },
    { id: 'REP-007', date: addDays(today, 22), clientName: 'Joseph Kariuki', amount: 7200, type: 'Repayment', loanId: 'LN-1007' },
    { id: 'REP-008', date: addDays(today, 25), clientName: 'Catherine Nyambura', amount: 11000, type: 'Repayment', loanId: 'LN-1008' },
    { id: 'REP-009', date: addDays(today, 30), clientName: 'Robert Wekesa', amount: 4500, type: 'Repayment', loanId: 'LN-1009' },
    { id: 'REP-010', date: addDays(today, 35), clientName: 'Anne Chebet', amount: 13500, type: 'Repayment', loanId: 'LN-1010' },
    { id: 'REP-011', date: addDays(today, 42), clientName: 'Paul Mutua', amount: 8800, type: 'Repayment', loanId: 'LN-1011' },
    { id: 'REP-012', date: addDays(today, 55), clientName: 'Jane Wangari', amount: 10200, type: 'Repayment', loanId: 'LN-1012' },
  ];

  const projectedIncome = [
    { id: 'INC-001', date: addDays(today, 3), clientName: 'Samuel Kipchoge', amount: 825, type: 'Interest', loanId: 'LN-1001' },
    { id: 'INC-002', date: addDays(today, 5), clientName: 'Alice Wambui', amount: 1230, type: 'Interest', loanId: 'LN-1002' },
    { id: 'INC-003', date: addDays(today, 5), clientName: 'Mary Wanjiku', amount: 1500, type: 'Application Fee', loanId: 'LN-NEW' },
    { id: 'INC-004', date: addDays(today, 7), clientName: 'Peter Ochieng', amount: 2000, type: 'Application Fee', loanId: 'LN-NEW' },
    { id: 'INC-005', date: addDays(today, 8), clientName: 'Daniel Mwangi', amount: 1800, type: 'Interest', loanId: 'LN-1003' },
    { id: 'INC-006', date: addDays(today, 12), clientName: 'Rose Atieno', amount: 1020, type: 'Interest', loanId: 'LN-1004' },
    { id: 'INC-007', date: addDays(today, 15), clientName: 'Michael Otieno', amount: 2250, type: 'Interest', loanId: 'LN-1005' },
    { id: 'INC-008', date: addDays(today, 18), clientName: 'Elizabeth Njeri', amount: 1425, type: 'Interest', loanId: 'LN-1006' },
    { id: 'INC-009', date: addDays(today, 20), clientName: 'Faith Akinyi', amount: 1600, type: 'Approval Fee', loanId: 'LN-NEW' },
    { id: 'INC-010', date: addDays(today, 25), clientName: 'Catherine Nyambura', amount: 1650, type: 'Interest', loanId: 'LN-1008' },
    { id: 'INC-011', date: addDays(today, 35), clientName: 'Anne Chebet', amount: 2025, type: 'Interest', loanId: 'LN-1010' },
    { id: 'INC-012', date: addDays(today, 45), clientName: 'Paul Mutua', amount: 1320, type: 'Interest', loanId: 'LN-1011' },
  ];

  return { pendingDisbursements, expectedRepayments, projectedIncome };
};

const { pendingDisbursements, expectedRepayments, projectedIncome } = generateFakeData();

type DateFilter = '7' | '30' | '60' | 'all';

export default function ExpectedLoans() {
  const [dateFilter, setDateFilter] = useState<DateFilter>('30');
  const today = startOfToday();

  const filterByDate = <T extends { date: Date }>(items: T[]): T[] => {
    if (dateFilter === 'all') return items;
    const days = parseInt(dateFilter);
    const endDate = addDays(today, days);
    return items.filter(item => 
      isWithinInterval(item.date, { start: today, end: endDate })
    );
  };

  const filteredDisbursements = useMemo(() => filterByDate(pendingDisbursements), [dateFilter]);
  const filteredRepayments = useMemo(() => filterByDate(expectedRepayments), [dateFilter]);
  const filteredIncome = useMemo(() => filterByDate(projectedIncome), [dateFilter]);

  const totalDisbursements = filteredDisbursements.reduce((sum, d) => sum + d.amount, 0);
  const totalRepayments = filteredRepayments.reduce((sum, r) => sum + r.amount, 0);
  const totalIncome = filteredIncome.reduce((sum, i) => sum + i.amount, 0);

  const formatCurrency = (amount: number) => `KES ${amount.toLocaleString()}`;

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
    { key: 'type', header: 'Type', cell: (item: typeof pendingDisbursements[0]) => (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
        {item.type}
      </span>
    )},
    { key: 'status', header: 'Status', cell: (item: typeof pendingDisbursements[0]) => (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
        {item.status}
      </span>
    )},
  ];

  const repaymentColumns = [
    { key: 'date', header: 'Date', cell: (item: typeof expectedRepayments[0]) => format(item.date, 'MMM dd, yyyy') },
    { key: 'client', header: 'Client', cell: (item: typeof expectedRepayments[0]) => item.clientName },
    { key: 'amount', header: 'Amount', cell: (item: typeof expectedRepayments[0]) => formatCurrency(item.amount) },
    { key: 'type', header: 'Type', cell: (item: typeof expectedRepayments[0]) => (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
        {item.type}
      </span>
    )},
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Expected Loans</h1>
          <p className="text-muted-foreground">Upcoming disbursements, repayments, and projected income</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateFilter} onValueChange={(value: DateFilter) => setDateFilter(value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Next 7 days</SelectItem>
              <SelectItem value="30">Next 30 days</SelectItem>
              <SelectItem value="60">Next 60 days</SelectItem>
              <SelectItem value="all">All upcoming</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportToExcel} variant="outline">
            <FileDown className="h-4 w-4 mr-2" />
            Export to Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Expected Disbursements"
          value={formatCurrency(totalDisbursements)}
          subtitle={`${filteredDisbursements.length} pending disbursements`}
          icon={<DollarSign className="h-5 w-5" />}
          variant="primary"
        />
        <StatCard
          title="Expected Repayments"
          value={formatCurrency(totalRepayments)}
          subtitle={`${filteredRepayments.length} upcoming payments`}
          icon={<Clock className="h-5 w-5" />}
          variant="accent"
        />
        <StatCard
          title="Projected Income"
          value={formatCurrency(totalIncome)}
          subtitle={`Interest + fees from ${filteredIncome.length} items`}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="default"
        />
      </div>

      {/* Pending Disbursements Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Pending Disbursements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={disbursementColumns}
            data={filteredDisbursements}
            emptyMessage="No pending disbursements in selected period"
          />
        </CardContent>
      </Card>

      {/* Expected Repayments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-500" />
            Expected Repayments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={repaymentColumns}
            data={filteredRepayments}
            emptyMessage="No expected repayments in selected period"
          />
        </CardContent>
      </Card>

      {/* Projected Income Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-amber-500" />
            Projected Income (Interest + Fees)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={incomeColumns}
            data={filteredIncome}
            emptyMessage="No projected income in selected period"
          />
        </CardContent>
      </Card>
    </div>
  );
}
