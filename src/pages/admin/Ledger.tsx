import { useState, useMemo } from 'react';

import { DataTable } from '@/components/shared/DataTable';
import { StatCard } from '@/components/shared/StatCard';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, BookOpen, TrendingUp } from 'lucide-react';
import { format, isWithinInterval, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { cn } from '@/lib/utils';

type IncomeSource = 'Application Fee' | 'Approval Fee' | 'Interest Collected' | 'Penalty';

interface LedgerEntry {
  id: string;
  date: Date;
  source: IncomeSource;
  amount: number;
  clientId: string;
  runningTotal: number;
}

// Mock ledger data
const mockLedgerData: Omit<LedgerEntry, 'runningTotal'>[] = [
  { id: '1', date: new Date('2026-01-02'), source: 'Application Fee', amount: 5000, clientId: 'CLT-001' },
  { id: '2', date: new Date('2026-01-03'), source: 'Approval Fee', amount: 15000, clientId: 'CLT-002' },
  { id: '3', date: new Date('2026-01-05'), source: 'Interest Collected', amount: 45000, clientId: 'CLT-001' },
  { id: '4', date: new Date('2026-01-07'), source: 'Penalty', amount: 2500, clientId: 'CLT-003' },
  { id: '5', date: new Date('2026-01-08'), source: 'Interest Collected', amount: 32000, clientId: 'CLT-004' },
  { id: '6', date: new Date('2025-12-15'), source: 'Application Fee', amount: 5000, clientId: 'CLT-005' },
  { id: '7', date: new Date('2025-12-18'), source: 'Approval Fee', amount: 20000, clientId: 'CLT-005' },
  { id: '8', date: new Date('2025-12-22'), source: 'Interest Collected', amount: 38000, clientId: 'CLT-002' },
  { id: '9', date: new Date('2025-12-28'), source: 'Penalty', amount: 3500, clientId: 'CLT-001' },
  { id: '10', date: new Date('2025-11-20'), source: 'Interest Collected', amount: 55000, clientId: 'CLT-003' },
];

const formatCurrency = (amount: number) => {
  return `K${amount.toLocaleString()}`;
};

const getSourceBadgeStyles = (source: IncomeSource) => {
  switch (source) {
    case 'Application Fee':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'Approval Fee':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'Interest Collected':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
    case 'Penalty':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export default function Ledger() {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const today = new Date();
  const currentMonthStart = startOfMonth(today);
  const currentMonthEnd = endOfMonth(today);
  const currentYearStart = startOfYear(today);
  const currentYearEnd = endOfYear(today);

  // Filter and calculate running totals
  const ledgerEntries = useMemo(() => {
    let filtered = [...mockLedgerData];

    // Apply date filters
    if (startDate && endDate) {
      filtered = filtered.filter(entry =>
        isWithinInterval(entry.date, { start: startDate, end: endDate })
      );
    } else if (startDate) {
      filtered = filtered.filter(entry => entry.date >= startDate);
    } else if (endDate) {
      filtered = filtered.filter(entry => entry.date <= endDate);
    }

    // Sort by date ascending
    filtered.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate running totals
    let runningTotal = 0;
    return filtered.map(entry => {
      runningTotal += entry.amount;
      return { ...entry, runningTotal };
    });
  }, [startDate, endDate]);

  // Calculate summary stats
  const monthlyIncome = useMemo(() => {
    return mockLedgerData
      .filter(entry => isWithinInterval(entry.date, { start: currentMonthStart, end: currentMonthEnd }))
      .reduce((sum, entry) => sum + entry.amount, 0);
  }, []);

  const yearlyIncome = useMemo(() => {
    return mockLedgerData
      .filter(entry => isWithinInterval(entry.date, { start: currentYearStart, end: currentYearEnd }))
      .reduce((sum, entry) => sum + entry.amount, 0);
  }, []);

  const totalEntries = ledgerEntries.length;
  const filteredTotal = ledgerEntries.reduce((sum, entry) => sum + entry.amount, 0);

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const columns = [
    {
      key: 'date',
      header: 'Date',
      cell: (entry: LedgerEntry) => (
        <span className="font-medium">{format(entry.date, 'MMM dd, yyyy')}</span>
      ),
    },
    {
      key: 'source',
      header: 'Source',
      cell: (entry: LedgerEntry) => (
        <span className={cn('inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium', getSourceBadgeStyles(entry.source))}>
          {entry.source}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      cell: (entry: LedgerEntry) => (
        <span className="font-semibold text-success">{formatCurrency(entry.amount)}</span>
      ),
    },
    {
      key: 'clientId',
      header: 'Client ID',
      cell: (entry: LedgerEntry) => (
        <span className="font-mono text-sm text-muted-foreground">{entry.clientId}</span>
      ),
    },
    {
      key: 'runningTotal',
      header: 'Running Total',
      cell: (entry: LedgerEntry) => (
        <span className="font-bold">{formatCurrency(entry.runningTotal)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight lg:text-3xl">Ledger</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Track all income sources and transactions</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="This Month"
          value={formatCurrency(monthlyIncome)}
          subtitle="January 2026"
          icon={<BookOpen className="h-5 w-5" />}
          variant="primary"
        />
        <StatCard
          title="This Year"
          value={formatCurrency(yearlyIncome)}
          subtitle="Year to date"
          icon={<TrendingUp className="h-5 w-5" />}
          variant="accent"
        />
        <StatCard
          title="Filtered Total"
          value={formatCurrency(filteredTotal)}
          subtitle={`${totalEntries} entries`}
          icon={<BookOpen className="h-5 w-5" />}
        />
        <StatCard
          title="Avg. Transaction"
          value={formatCurrency(totalEntries > 0 ? Math.round(filteredTotal / totalEntries) : 0)}
          subtitle="Per entry"
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center rounded-lg border border-border bg-card p-3 sm:p-4">
        <span className="text-sm font-medium text-muted-foreground">Filter by date:</span>
        
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('w-full sm:w-[180px] justify-start text-left font-normal h-10 sm:h-9', !startDate && 'text-muted-foreground')}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, 'MMM dd, yyyy') : 'Start date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <span className="text-muted-foreground hidden sm:block">to</span>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('w-full sm:w-[180px] justify-start text-left font-normal h-10 sm:h-9', !endDate && 'text-muted-foreground')}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, 'MMM dd, yyyy') : 'End date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          {(startDate || endDate) && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10 sm:h-9">
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Ledger Table */}
      <DataTable
        columns={columns}
        data={ledgerEntries}
        emptyMessage="No ledger entries found for the selected date range"
      />
    </div>
  );
}
