import { Link } from 'react-router-dom';
import { ArrowRight, Eye } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { loans } from '@/lib/mockData';

export default function BorrowerLoans() {
  const { user } = useAuth();
  const userLoans = loans.filter(l => l.clientId === user?.id);

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
      key: 'id',
      header: 'Loan ID',
      cell: (loan: typeof loans[0]) => (
        <span className="font-medium">{loan.id}</span>
      ),
    },
    {
      key: 'product',
      header: 'Product',
      cell: (loan: typeof loans[0]) => loan.product,
    },
    {
      key: 'amount',
      header: 'Amount',
      cell: (loan: typeof loans[0]) => formatCurrency(loan.amount),
    },
    {
      key: 'outstanding',
      header: 'Outstanding',
      cell: (loan: typeof loans[0]) => (
        <span className={loan.outstandingBalance > 0 ? 'text-warning' : 'text-success'}>
          {formatCurrency(loan.outstandingBalance)}
        </span>
      ),
    },
    {
      key: 'disbursedDate',
      header: 'Disbursed',
      cell: (loan: typeof loans[0]) => formatDate(loan.disbursedDate),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (loan: typeof loans[0]) => <StatusBadge status={loan.status} />,
    },
    {
      key: 'actions',
      header: '',
      cell: (loan: typeof loans[0]) => (
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/borrower/schedule?loanId=${loan.id}`}>
            <Eye className="h-4 w-4 mr-1" />
            Schedule
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout requiredRole="borrower">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Loans</h1>
            <p className="mt-1 text-muted-foreground">
              View all your loan history and details
            </p>
          </div>
          <Button variant="accent" asChild>
            <Link to="/borrower/apply">
              Apply for New Loan
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <DataTable 
          columns={columns} 
          data={userLoans}
          emptyMessage="You don't have any loans yet"
        />
      </div>
    </DashboardLayout>
  );
}
