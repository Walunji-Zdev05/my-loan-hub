import { useState, useMemo } from 'react';

import { DataTable } from '@/components/shared/DataTable';
import { StatCard } from '@/components/shared/StatCard';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, BookOpen, TrendingUp, Loader2 } from 'lucide-react';
import { format, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';
import { useLedgerEntries, useLedgerSummary, LedgerEntryWithDetails } from '@/hooks/useLedger';

const formatCurrency = (amount: number) => {
  return `K${amount.toLocaleString()}`;
};

const getSourceBadgeStyles = (source: string) => {
  switch (source) {
    case 'application_fee':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'approval_fee':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'interest':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
    case 'penalty':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'repayment':
      return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const formatEntryType = (type: string) => {
  return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export default function Ledger() {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  const { data: entries, isLoading } = useLedgerEntries({ startDate, endDate });
  const { data: summary } = useLedgerSummary();

  // Calculate running totals and filter
  const ledgerEntries = useMemo(() => {
    if (!entries) return [];
    
    let filtered = [...entries];

    // Apply date filters
    if (startDate && endDate) {
      filtered = filtered.filter(entry =>
        isWithinInterval(new Date(entry.entry_date), { start: startDate, end: endDate })
      );
    } else if (startDate) {
      filtered = filtered.filter(entry => new Date(entry.entry_date) >= startDate);
    } else if (endDate) {
      filtered = filtered.filter(entry => new Date(entry.entry_date) <= endDate);
    }

    // Sort by date ascending and calculate running totals
    filtered.sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime());

    let runningTotal = 0;
    return filtered.map(entry => {
      runningTotal += Number(entry.amount);
      return { ...entry, runningTotal };
    });
  }, [entries, startDate, endDate]);

  const totalEntries = ledgerEntries.length;
  const filteredTotal = ledgerEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const columns = [
    {
      key: 'date',
      header: 'Date',
      cell: (entry: LedgerEntryWithDetails & { runningTotal: number }) => (
        <span className="font-medium">{format(new Date(entry.entry_date), 'MMM dd, yyyy')}</span>
      ),
    },
    {
      key: 'source',
      header: 'Source',
      cell: (entry: LedgerEntryWithDetails & { runningTotal: number }) => (
        <span className={cn('inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium', getSourceBadgeStyles(entry.entry_type))}>
          {formatEntryType(entry.entry_type)}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      cell: (entry: LedgerEntryWithDetails & { runningTotal: number }) => (
        <span className="font-semibold text-success">{formatCurrency(Number(entry.amount))}</span>
      ),
    },
    {
      key: 'clientId',
      header: 'Client ID',
      cell: (entry: LedgerEntryWithDetails & { runningTotal: number }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {entry.clients?.client_number || 'N/A'}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'client',
      header: 'Client Name',
      cell: (entry: LedgerEntryWithDetails & { runningTotal: number }) => (
        <span className="text-sm">
          {entry.clients ? `${entry.clients.first_name} ${entry.clients.last_name}` : entry.loans?.loan_number || 'N/A'}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'runningTotal',
      header: 'Running Total',
      cell: (entry: LedgerEntryWithDetails & { runningTotal: number }) => (
        <span className="font-bold">{formatCurrency(entry.runningTotal)}</span>
      ),
      hideOnMobile: true,
    },
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
          value={formatCurrency(summary?.monthlyIncome || 0)}
          subtitle={format(new Date(), 'MMMM yyyy')}
          icon={<BookOpen className="h-5 w-5" />}
          variant="primary"
        />
        <StatCard
          title="This Year"
          value={formatCurrency(summary?.yearlyIncome || 0)}
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
