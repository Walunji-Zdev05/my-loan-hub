import { useSearchParams } from 'react-router-dom';
import { Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { loans, generateSchedule, ScheduleItem } from '@/lib/mockData';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState, useEffect } from 'react';

export default function RepaymentSchedule() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const userLoans = loans.filter(l => l.clientId === user?.id && (l.status === 'active' || l.status === 'overdue'));
  
  const initialLoanId = searchParams.get('loanId') || userLoans[0]?.id || '';
  const [selectedLoanId, setSelectedLoanId] = useState(initialLoanId);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);

  useEffect(() => {
    if (selectedLoanId) {
      setSchedule(generateSchedule(selectedLoanId));
    }
  }, [selectedLoanId]);

  const selectedLoan = loans.find(l => l.id === selectedLoanId);

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount);

  const formatDate = (date: string) => 
    new Date(date).toLocaleDateString('en-KE', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });

  const columns = [
    {
      key: 'dueDate',
      header: 'Due Date',
      cell: (item: ScheduleItem) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {formatDate(item.dueDate)}
        </div>
      ),
    },
    {
      key: 'principal',
      header: 'Principal',
      cell: (item: ScheduleItem) => formatCurrency(item.principal),
    },
    {
      key: 'interest',
      header: 'Interest',
      cell: (item: ScheduleItem) => formatCurrency(item.interest),
    },
    {
      key: 'total',
      header: 'Total',
      cell: (item: ScheduleItem) => (
        <span className="font-medium">{formatCurrency(item.total)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (item: ScheduleItem) => <StatusBadge status={item.status} />,
    },
    {
      key: 'paidDate',
      header: 'Paid Date',
      cell: (item: ScheduleItem) => (
        item.paidDate ? formatDate(item.paidDate) : '—'
      ),
    },
  ];

  const paidItems = schedule.filter(s => s.status === 'paid');
  const pendingItems = schedule.filter(s => s.status === 'pending');
  const overdueItems = schedule.filter(s => s.status === 'overdue');

  return (
    <DashboardLayout requiredRole="borrower">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Repayment Schedule</h1>
            <p className="mt-1 text-muted-foreground">
              View your payment timeline and track progress
            </p>
          </div>
          {userLoans.length > 1 && (
            <Select value={selectedLoanId} onValueChange={setSelectedLoanId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select loan" />
              </SelectTrigger>
              <SelectContent>
                {userLoans.map(loan => (
                  <SelectItem key={loan.id} value={loan.id}>
                    {loan.id} - {loan.product}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {selectedLoan && (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Paid</p>
                  <p className="text-lg font-semibold">{paidItems.length} of {schedule.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-lg font-semibold">{pendingItems.length} payments</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Overdue</p>
                  <p className="text-lg font-semibold">{overdueItems.length} payments</p>
                </div>
              </div>
            </div>

            {/* Schedule Table */}
            <DataTable 
              columns={columns} 
              data={schedule}
              emptyMessage="No schedule available"
            />
          </>
        )}

        {!selectedLoan && userLoans.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold">No Active Loans</h2>
            <p className="text-muted-foreground">
              Apply for a loan to view your repayment schedule
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
