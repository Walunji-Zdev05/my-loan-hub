import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/shared/DataTable';
import { Download, BookOpenCheck, Search, X, Loader2 } from 'lucide-react';
import { useLoans, LoanWithClient } from '@/hooks/useLoans';

const formatCurrency = (amount: number) => {
  return `K${amount.toLocaleString()}`;
};

export default function LoanBook() {
  const [searchQuery, setSearchQuery] = useState('');
  const [arrearsFilter, setArrearsFilter] = useState<string>('all');

  const { data: loans, isLoading } = useLoans(['active', 'overdue', 'disbursed']);

  const filteredData = useMemo(() => {
    return (loans || []).filter(loan => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const clientName = `${loan.clients?.first_name || ''} ${loan.clients?.last_name || ''}`.toLowerCase();
      const matchesSearch = searchQuery === '' || 
        clientName.includes(searchLower) ||
        loan.clients?.client_number.toLowerCase().includes(searchLower) ||
        loan.loan_number.toLowerCase().includes(searchLower);

      // Arrears filter (overdue status indicates arrears)
      const hasArrears = loan.status === 'overdue';
      const matchesArrears = 
        arrearsFilter === 'all' ||
        (arrearsFilter === 'with-arrears' && hasArrears) ||
        (arrearsFilter === 'no-arrears' && !hasArrears);

      return matchesSearch && matchesArrears;
    });
  }, [loans, searchQuery, arrearsFilter]);

  const clearFilters = () => {
    setSearchQuery('');
    setArrearsFilter('all');
  };

  const hasActiveFilters = searchQuery !== '' || arrearsFilter !== 'all';

  const handleExportToExcel = () => {
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
    const filename = `Loan Book as of ${formattedDate}.csv`;

    const headers = ['Client ID', 'Client Name', 'Loan ID', 'Loan Amount', 'Interest Rate', 'Term (Months)', 'Total Amount', 'Monthly Payment', 'Outstanding Balance', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(loan => [
        loan.clients?.client_number || '',
        `"${loan.clients?.first_name || ''} ${loan.clients?.last_name || ''}"`,
        loan.loan_number,
        loan.principal_amount,
        loan.interest_rate,
        loan.term_months,
        loan.total_amount,
        loan.monthly_payment,
        loan.outstanding_balance,
        loan.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const columns = [
    { 
      key: 'clientId', 
      header: 'Client ID', 
      cell: (loan: LoanWithClient) => (
        <span className="font-mono text-xs text-muted-foreground">{loan.clients?.client_number || '-'}</span>
      )
    },
    { 
      key: 'clientName', 
      header: 'Client Name', 
      cell: (loan: LoanWithClient) => (
        <span className="font-medium">{loan.clients?.first_name} {loan.clients?.last_name}</span>
      )
    },
    { 
      key: 'loanId', 
      header: 'Loan ID', 
      cell: (loan: LoanWithClient) => (
        <span className="text-muted-foreground">{loan.loan_number}</span>
      )
    },
    { 
      key: 'loanAmount', 
      header: 'Loan Amount', 
      cell: (loan: LoanWithClient) => formatCurrency(Number(loan.principal_amount))
    },
    { 
      key: 'interestRate', 
      header: 'Interest Rate', 
      cell: (loan: LoanWithClient) => `${loan.interest_rate}%`
    },
    { 
      key: 'termMonths', 
      header: 'Term', 
      cell: (loan: LoanWithClient) => `${loan.term_months} months`
    },
    { 
      key: 'totalAmount', 
      header: 'Total Amount', 
      cell: (loan: LoanWithClient) => formatCurrency(Number(loan.total_amount))
    },
    { 
      key: 'monthlyPayment', 
      header: 'Monthly Payment', 
      cell: (loan: LoanWithClient) => formatCurrency(Number(loan.monthly_payment))
    },
    { 
      key: 'outstandingBalance', 
      header: 'Outstanding', 
      cell: (loan: LoanWithClient) => (
        <span className="font-medium text-primary">{formatCurrency(Number(loan.outstanding_balance))}</span>
      )
    },
    { 
      key: 'status', 
      header: 'Status', 
      cell: (loan: LoanWithClient) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          loan.status === 'overdue' ? 'bg-destructive/10 text-destructive' : 
          loan.status === 'active' ? 'bg-success/10 text-success' :
          'bg-muted text-muted-foreground'
        }`}>
          {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
        </span>
      )
    },
  ];

  const totalOutstanding = filteredData.reduce((sum, loan) => sum + Number(loan.outstanding_balance), 0);
  const overdueLoans = filteredData.filter(loan => loan.status === 'overdue');
  const totalArrears = overdueLoans.reduce((sum, loan) => sum + Number(loan.outstanding_balance), 0);
  const totalLoans = filteredData.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Loan Book</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Complete portfolio of all active loans</p>
        </div>
        <Button onClick={handleExportToExcel} size="sm" className="gap-2 h-10 sm:h-9 w-full sm:w-auto">
          <Download className="h-4 w-4" />
          Export to Excel
        </Button>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="p-4 sm:p-0">
          <CardHeader className="p-0 sm:p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
            <BookOpenCheck className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">{totalLoans}</div>
          </CardContent>
        </Card>
        <Card className="p-4 sm:p-0">
          <CardHeader className="p-0 sm:p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold text-primary">{formatCurrency(totalOutstanding)}</div>
          </CardContent>
        </Card>
        <Card className="p-4 sm:p-0">
          <CardHeader className="p-0 sm:p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Loans</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold text-destructive">
              {overdueLoans.length} ({formatCurrency(totalArrears)})
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-3">
            <CardTitle className="text-base sm:text-lg">All Loans</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by client or loan ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 sm:h-9 w-full"
                />
              </div>
              <div className="flex gap-2">
                <Select value={arrearsFilter} onValueChange={setArrearsFilter}>
                  <SelectTrigger className="h-10 sm:h-9 flex-1 sm:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Loans</SelectItem>
                    <SelectItem value="with-arrears">Overdue</SelectItem>
                    <SelectItem value="no-arrears">Current</SelectItem>
                  </SelectContent>
                </Select>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 h-10 sm:h-9 px-3">
                    <X className="h-4 w-4" />
                    <span className="hidden sm:inline">Clear</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
          {hasActiveFilters && (
            <p className="text-sm text-muted-foreground mt-2">
              Showing {filteredData.length} of {loans?.length || 0} loans
            </p>
          )}
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          <DataTable columns={columns} data={filteredData} emptyMessage="No loans match your search criteria" />
        </CardContent>
      </Card>
    </div>
  );
}
