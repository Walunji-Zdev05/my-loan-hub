import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/shared/DataTable';
import { Download, BookOpenCheck, Search, X } from 'lucide-react';

interface LoanBookEntry {
  id: string;
  clientId: string;
  clientName: string;
  loanId: string;
  loanAmount: number;
  interestAmount: number;
  repaymentTerm: number;
  totalExpected: number;
  installmentAmount: number;
  frequency: string;
  outstandingBalance: number;
  outstandingPrincipal: number;
  outstandingInterest: number;
  arrearsAmount: number;
}

const mockLoanBookData: LoanBookEntry[] = [
  { id: '1', clientId: 'CL-001', clientName: 'John Banda', loanId: 'LN-001', loanAmount: 500000, interestAmount: 75000, repaymentTerm: 12, totalExpected: 575000, installmentAmount: 47917, frequency: 'Monthly', outstandingBalance: 287500, outstandingPrincipal: 250000, outstandingInterest: 37500, arrearsAmount: 0 },
  { id: '2', clientId: 'CL-002', clientName: 'Mary Phiri', loanId: 'LN-002', loanAmount: 250000, interestAmount: 37500, repaymentTerm: 6, totalExpected: 287500, installmentAmount: 47917, frequency: 'Monthly', outstandingBalance: 143750, outstandingPrincipal: 125000, outstandingInterest: 18750, arrearsAmount: 15000 },
  { id: '3', clientId: 'CL-003', clientName: 'Peter Mwale', loanId: 'LN-003', loanAmount: 1000000, interestAmount: 150000, repaymentTerm: 24, totalExpected: 1150000, installmentAmount: 47917, frequency: 'Monthly', outstandingBalance: 862500, outstandingPrincipal: 750000, outstandingInterest: 112500, arrearsAmount: 0 },
  { id: '4', clientId: 'CL-004', clientName: 'Grace Tembo', loanId: 'LN-004', loanAmount: 150000, interestAmount: 22500, repaymentTerm: 3, totalExpected: 172500, installmentAmount: 57500, frequency: 'Monthly', outstandingBalance: 57500, outstandingPrincipal: 50000, outstandingInterest: 7500, arrearsAmount: 28750 },
  { id: '5', clientId: 'CL-005', clientName: 'David Chirwa', loanId: 'LN-005', loanAmount: 750000, interestAmount: 112500, repaymentTerm: 18, totalExpected: 862500, installmentAmount: 47917, frequency: 'Monthly', outstandingBalance: 575000, outstandingPrincipal: 500000, outstandingInterest: 75000, arrearsAmount: 0 },
  { id: '6', clientId: 'CL-006', clientName: 'Sarah Kamanga', loanId: 'LN-006', loanAmount: 300000, interestAmount: 45000, repaymentTerm: 12, totalExpected: 345000, installmentAmount: 28750, frequency: 'Monthly', outstandingBalance: 172500, outstandingPrincipal: 150000, outstandingInterest: 22500, arrearsAmount: 8625 },
  { id: '7', clientId: 'CL-007', clientName: 'James Nyirenda', loanId: 'LN-007', loanAmount: 450000, interestAmount: 67500, repaymentTerm: 9, totalExpected: 517500, installmentAmount: 57500, frequency: 'Monthly', outstandingBalance: 345000, outstandingPrincipal: 300000, outstandingInterest: 45000, arrearsAmount: 0 },
  { id: '8', clientId: 'CL-008', clientName: 'Ruth Mbewe', loanId: 'LN-008', loanAmount: 200000, interestAmount: 30000, repaymentTerm: 6, totalExpected: 230000, installmentAmount: 38333, frequency: 'Monthly', outstandingBalance: 115000, outstandingPrincipal: 100000, outstandingInterest: 15000, arrearsAmount: 19167 },
  { id: '9', clientId: 'CL-009', clientName: 'Moses Zulu', loanId: 'LN-009', loanAmount: 600000, interestAmount: 90000, repaymentTerm: 12, totalExpected: 690000, installmentAmount: 57500, frequency: 'Monthly', outstandingBalance: 460000, outstandingPrincipal: 400000, outstandingInterest: 60000, arrearsAmount: 0 },
  { id: '10', clientId: 'CL-010', clientName: 'Agnes Kondowe', loanId: 'LN-010', loanAmount: 350000, interestAmount: 52500, repaymentTerm: 8, totalExpected: 402500, installmentAmount: 50313, frequency: 'Monthly', outstandingBalance: 201250, outstandingPrincipal: 175000, outstandingInterest: 26250, arrearsAmount: 12578 },
];

const formatCurrency = (amount: number) => {
  return `K${amount.toLocaleString()}`;
};

export default function LoanBook() {
  const [searchQuery, setSearchQuery] = useState('');
  const [arrearsFilter, setArrearsFilter] = useState<string>('all');

  const filteredData = useMemo(() => {
    return mockLoanBookData.filter(entry => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === '' || 
        entry.clientName.toLowerCase().includes(searchLower) ||
        entry.clientId.toLowerCase().includes(searchLower) ||
        entry.loanId.toLowerCase().includes(searchLower);

      // Arrears filter
      const matchesArrears = 
        arrearsFilter === 'all' ||
        (arrearsFilter === 'with-arrears' && entry.arrearsAmount > 0) ||
        (arrearsFilter === 'no-arrears' && entry.arrearsAmount === 0);

      return matchesSearch && matchesArrears;
    });
  }, [searchQuery, arrearsFilter]);

  const clearFilters = () => {
    setSearchQuery('');
    setArrearsFilter('all');
  };

  const hasActiveFilters = searchQuery !== '' || arrearsFilter !== 'all';

  const handleExportToExcel = () => {
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
    const filename = `Loan Book as of ${formattedDate}.csv`;

    const headers = ['Client ID', 'Client Name', 'Loan ID', 'Loan Amount', 'Interest Amount', 'Repayment Term', 'Total Expected', 'Installment Amount', 'Frequency', 'Outstanding Balance', 'Outstanding Principal', 'Outstanding Interest', 'Arrears Amount'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(entry => [
        entry.clientId,
        `"${entry.clientName}"`,
        entry.loanId,
        entry.loanAmount,
        entry.interestAmount,
        entry.repaymentTerm,
        entry.totalExpected,
        entry.installmentAmount,
        entry.frequency,
        entry.outstandingBalance,
        entry.outstandingPrincipal,
        entry.outstandingInterest,
        entry.arrearsAmount
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
    { key: 'clientId', header: 'Client ID', cell: (entry: LoanBookEntry) => <span className="font-mono text-xs text-muted-foreground">{entry.clientId}</span> },
    { key: 'clientName', header: 'Client Name', cell: (entry: LoanBookEntry) => <span className="font-medium">{entry.clientName}</span> },
    { key: 'loanId', header: 'Loan ID', cell: (entry: LoanBookEntry) => <span className="text-muted-foreground">{entry.loanId}</span> },
    { key: 'loanAmount', header: 'Loan Amount', cell: (entry: LoanBookEntry) => formatCurrency(entry.loanAmount) },
    { key: 'interestAmount', header: 'Interest Amount', cell: (entry: LoanBookEntry) => formatCurrency(entry.interestAmount) },
    { key: 'repaymentTerm', header: 'Term (Months)', cell: (entry: LoanBookEntry) => entry.repaymentTerm },
    { key: 'totalExpected', header: 'Total Expected', cell: (entry: LoanBookEntry) => formatCurrency(entry.totalExpected) },
    { key: 'installmentAmount', header: 'Installment', cell: (entry: LoanBookEntry) => formatCurrency(entry.installmentAmount) },
    { key: 'frequency', header: 'Frequency', cell: (entry: LoanBookEntry) => entry.frequency },
    { key: 'outstandingBalance', header: 'Outstanding Balance', cell: (entry: LoanBookEntry) => <span className="font-medium text-primary">{formatCurrency(entry.outstandingBalance)}</span> },
    { key: 'outstandingPrincipal', header: 'O/S Principal', cell: (entry: LoanBookEntry) => formatCurrency(entry.outstandingPrincipal) },
    { key: 'outstandingInterest', header: 'O/S Interest', cell: (entry: LoanBookEntry) => formatCurrency(entry.outstandingInterest) },
    { key: 'arrearsAmount', header: 'Arrears', cell: (entry: LoanBookEntry) => (
      <span className={entry.arrearsAmount > 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
        {formatCurrency(entry.arrearsAmount)}
      </span>
    )},
  ];

  const totalOutstanding = filteredData.reduce((sum, e) => sum + e.outstandingBalance, 0);
  const totalArrears = filteredData.reduce((sum, e) => sum + e.arrearsAmount, 0);
  const totalLoans = filteredData.length;

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
            <CardTitle className="text-sm font-medium">Total Arrears</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold text-destructive">{formatCurrency(totalArrears)}</div>
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
                    <SelectValue placeholder="Arrears Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Loans</SelectItem>
                    <SelectItem value="with-arrears">With Arrears</SelectItem>
                    <SelectItem value="no-arrears">No Arrears</SelectItem>
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
              Showing {filteredData.length} of {mockLoanBookData.length} loans
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
