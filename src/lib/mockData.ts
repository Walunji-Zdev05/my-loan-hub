// Mock data for the loan management system

export interface Client {
  id: string;
  name: string;
  nationalId: string;
  email: string;
  phone: string;
  joinDate: string;
  totalLoans: number;
  activeLoans: number;
}

export interface Loan {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  disbursedAmount: number;
  outstandingBalance: number;
  interestRate: number;
  term: number;
  termUnit: 'months' | 'weeks';
  product: string;
  status: 'active' | 'paid' | 'overdue' | 'pending';
  disbursedDate: string;
  dueDate: string;
  nextPaymentDate: string;
  nextPaymentAmount: number;
}

export interface Payment {
  id: string;
  loanId: string;
  clientName: string;
  amount: number;
  date: string;
  method: 'cash' | 'bank' | 'mobile';
  status: 'completed' | 'pending' | 'failed';
}

export interface LoanApplication {
  id: string;
  clientId: string;
  clientName: string;
  nationalId: string;
  amount: number;
  term: number;
  termUnit: 'months' | 'weeks';
  product: string;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedDate: string;
}

export interface LoanProduct {
  id: string;
  name: string;
  minAmount: number;
  maxAmount: number;
  interestRate: number;
  maxTerm: number;
  termUnit: 'months' | 'weeks';
  description: string;
  isActive: boolean;
}

export interface ScheduleItem {
  id: string;
  dueDate: string;
  principal: number;
  interest: number;
  total: number;
  status: 'paid' | 'pending' | 'overdue';
  paidDate?: string;
}

// Mock Clients
export const clients: Client[] = [
  { id: 'C001', name: 'John Mwangi', nationalId: '12345678', email: 'john@email.com', phone: '+254712345678', joinDate: '2023-01-15', totalLoans: 3, activeLoans: 1 },
  { id: 'C002', name: 'Mary Wanjiku', nationalId: '23456789', email: 'mary@email.com', phone: '+254723456789', joinDate: '2023-03-20', totalLoans: 2, activeLoans: 1 },
  { id: 'C003', name: 'Peter Ochieng', nationalId: '34567890', email: 'peter@email.com', phone: '+254734567890', joinDate: '2023-06-10', totalLoans: 1, activeLoans: 1 },
  { id: 'C004', name: 'Grace Akinyi', nationalId: '45678901', email: 'grace@email.com', phone: '+254745678901', joinDate: '2023-08-05', totalLoans: 2, activeLoans: 0 },
  { id: 'C005', name: 'David Kimani', nationalId: '56789012', email: 'david@email.com', phone: '+254756789012', joinDate: '2024-01-12', totalLoans: 1, activeLoans: 1 },
  { id: 'C006', name: 'Sarah Njeri', nationalId: '67890123', email: 'sarah@email.com', phone: '+254767890123', joinDate: '2024-02-28', totalLoans: 1, activeLoans: 1 },
];

// Mock Loans
export const loans: Loan[] = [
  { id: 'L001', clientId: 'C001', clientName: 'John Mwangi', amount: 50000, disbursedAmount: 50000, outstandingBalance: 35000, interestRate: 12, term: 12, termUnit: 'months', product: 'Personal Loan', status: 'active', disbursedDate: '2024-06-15', dueDate: '2025-06-15', nextPaymentDate: '2025-01-15', nextPaymentAmount: 4583 },
  { id: 'L002', clientId: 'C002', clientName: 'Mary Wanjiku', amount: 100000, disbursedAmount: 100000, outstandingBalance: 80000, interestRate: 10, term: 24, termUnit: 'months', product: 'Business Loan', status: 'active', disbursedDate: '2024-03-01', dueDate: '2026-03-01', nextPaymentDate: '2025-01-01', nextPaymentAmount: 4583 },
  { id: 'L003', clientId: 'C003', clientName: 'Peter Ochieng', amount: 25000, disbursedAmount: 25000, outstandingBalance: 5000, interestRate: 15, term: 6, termUnit: 'months', product: 'Emergency Loan', status: 'active', disbursedDate: '2024-09-01', dueDate: '2025-03-01', nextPaymentDate: '2025-01-01', nextPaymentAmount: 4375 },
  { id: 'L004', clientId: 'C004', clientName: 'Grace Akinyi', amount: 75000, disbursedAmount: 75000, outstandingBalance: 0, interestRate: 12, term: 12, termUnit: 'months', product: 'Personal Loan', status: 'paid', disbursedDate: '2023-12-01', dueDate: '2024-12-01', nextPaymentDate: '', nextPaymentAmount: 0 },
  { id: 'L005', clientId: 'C005', clientName: 'David Kimani', amount: 150000, disbursedAmount: 150000, outstandingBalance: 145000, interestRate: 8, term: 36, termUnit: 'months', product: 'Asset Finance', status: 'active', disbursedDate: '2024-11-01', dueDate: '2027-11-01', nextPaymentDate: '2025-01-01', nextPaymentAmount: 4514 },
  { id: 'L006', clientId: 'C006', clientName: 'Sarah Njeri', amount: 30000, disbursedAmount: 30000, outstandingBalance: 32000, interestRate: 18, term: 8, termUnit: 'weeks', product: 'Emergency Loan', status: 'overdue', disbursedDate: '2024-10-15', dueDate: '2024-12-10', nextPaymentDate: '2024-12-24', nextPaymentAmount: 4125 },
  { id: 'L007', clientId: 'C001', clientName: 'John Mwangi', amount: 20000, disbursedAmount: 20000, outstandingBalance: 0, interestRate: 15, term: 4, termUnit: 'months', product: 'Emergency Loan', status: 'paid', disbursedDate: '2024-01-15', dueDate: '2024-05-15', nextPaymentDate: '', nextPaymentAmount: 0 },
];

// Mock Payments
export const payments: Payment[] = [
  { id: 'P001', loanId: 'L001', clientName: 'John Mwangi', amount: 4583, date: '2024-12-15', method: 'mobile', status: 'completed' },
  { id: 'P002', loanId: 'L001', clientName: 'John Mwangi', amount: 4583, date: '2024-11-15', method: 'mobile', status: 'completed' },
  { id: 'P003', loanId: 'L002', clientName: 'Mary Wanjiku', amount: 4583, date: '2024-12-01', method: 'bank', status: 'completed' },
  { id: 'P004', loanId: 'L003', clientName: 'Peter Ochieng', amount: 4375, date: '2024-12-01', method: 'cash', status: 'completed' },
  { id: 'P005', loanId: 'L005', clientName: 'David Kimani', amount: 4514, date: '2024-12-01', method: 'bank', status: 'completed' },
  { id: 'P006', loanId: 'L004', clientName: 'Grace Akinyi', amount: 7000, date: '2024-11-28', method: 'mobile', status: 'completed' },
  { id: 'P007', loanId: 'L002', clientName: 'Mary Wanjiku', amount: 4583, date: '2024-11-01', method: 'bank', status: 'completed' },
  { id: 'P008', loanId: 'L003', clientName: 'Peter Ochieng', amount: 4375, date: '2024-11-01', method: 'cash', status: 'completed' },
];

// Mock Loan Applications
export const loanApplications: LoanApplication[] = [
  { id: 'A001', clientId: 'C001', clientName: 'John Mwangi', nationalId: '12345678', amount: 80000, term: 18, termUnit: 'months', product: 'Business Loan', purpose: 'Expand retail shop inventory', status: 'pending', appliedDate: '2024-12-28' },
  { id: 'A002', clientId: 'C003', clientName: 'Peter Ochieng', nationalId: '34567890', amount: 50000, term: 12, termUnit: 'months', product: 'Personal Loan', purpose: 'Home renovation', status: 'pending', appliedDate: '2024-12-27' },
  { id: 'A003', clientId: 'C006', clientName: 'Sarah Njeri', nationalId: '67890123', amount: 200000, term: 24, termUnit: 'months', product: 'Asset Finance', purpose: 'Purchase delivery motorcycle', status: 'pending', appliedDate: '2024-12-26' },
];

// Mock Loan Products
export const loanProducts: LoanProduct[] = [
  { id: 'PR001', name: 'Personal Loan', minAmount: 10000, maxAmount: 500000, interestRate: 12, maxTerm: 24, termUnit: 'months', description: 'For personal use including education, medical, and home improvements', isActive: true },
  { id: 'PR002', name: 'Business Loan', minAmount: 50000, maxAmount: 2000000, interestRate: 10, maxTerm: 36, termUnit: 'months', description: 'For business expansion, inventory, and working capital', isActive: true },
  { id: 'PR003', name: 'Emergency Loan', minAmount: 5000, maxAmount: 100000, interestRate: 15, maxTerm: 12, termUnit: 'weeks', description: 'Quick access loans for urgent needs', isActive: true },
  { id: 'PR004', name: 'Asset Finance', minAmount: 100000, maxAmount: 5000000, interestRate: 8, maxTerm: 48, termUnit: 'months', description: 'For purchasing vehicles, machinery, and equipment', isActive: true },
  { id: 'PR005', name: 'Agricultural Loan', minAmount: 25000, maxAmount: 1000000, interestRate: 9, maxTerm: 12, termUnit: 'months', description: 'For farming inputs, equipment, and seasonal needs', isActive: false },
];

// Generate repayment schedule for a loan
export const generateSchedule = (loanId: string): ScheduleItem[] => {
  const loan = loans.find(l => l.id === loanId);
  if (!loan) return [];

  const schedule: ScheduleItem[] = [];
  const monthlyPayment = loan.amount * (1 + loan.interestRate / 100) / loan.term;
  const principal = loan.amount / loan.term;
  const interest = monthlyPayment - principal;
  
  const startDate = new Date(loan.disbursedDate);
  
  for (let i = 1; i <= loan.term; i++) {
    const dueDate = new Date(startDate);
    if (loan.termUnit === 'months') {
      dueDate.setMonth(dueDate.getMonth() + i);
    } else {
      dueDate.setDate(dueDate.getDate() + i * 7);
    }

    const isPaid = i <= (loan.term - Math.ceil(loan.outstandingBalance / monthlyPayment));
    const isOverdue = !isPaid && dueDate < new Date();

    schedule.push({
      id: `${loanId}-S${i.toString().padStart(3, '0')}`,
      dueDate: dueDate.toISOString().split('T')[0],
      principal: Math.round(principal),
      interest: Math.round(interest),
      total: Math.round(monthlyPayment),
      status: isPaid ? 'paid' : isOverdue ? 'overdue' : 'pending',
      paidDate: isPaid ? dueDate.toISOString().split('T')[0] : undefined,
    });
  }

  return schedule;
};

// Dashboard statistics
export const getDashboardStats = () => {
  const activeLoans = loans.filter(l => l.status === 'active' || l.status === 'overdue');
  const totalDisbursed = loans.reduce((sum, l) => sum + l.disbursedAmount, 0);
  const outstandingBalance = loans.reduce((sum, l) => sum + l.outstandingBalance, 0);
  const overdueLoans = loans.filter(l => l.status === 'overdue');
  const totalCollected = totalDisbursed - outstandingBalance;
  const collectionRate = totalDisbursed > 0 ? (totalCollected / totalDisbursed) * 100 : 0;

  return {
    totalDisbursed,
    outstandingBalance,
    overdueCount: overdueLoans.length,
    overdueAmount: overdueLoans.reduce((sum, l) => sum + l.outstandingBalance, 0),
    collectionRate: Math.round(collectionRate * 10) / 10,
    activeLoansCount: activeLoans.length,
    totalClients: clients.length,
    pendingApplications: loanApplications.filter(a => a.status === 'pending').length,
  };
};

// Chart data for admin dashboard
export const getMonthlyDisbursements = () => [
  { month: 'Jul', amount: 125000 },
  { month: 'Aug', amount: 180000 },
  { month: 'Sep', amount: 155000 },
  { month: 'Oct', amount: 210000 },
  { month: 'Nov', amount: 195000 },
  { month: 'Dec', amount: 230000 },
];

export const getCollectionTrend = () => [
  { month: 'Jul', collected: 45000, expected: 50000 },
  { month: 'Aug', collected: 62000, expected: 65000 },
  { month: 'Sep', collected: 58000, expected: 60000 },
  { month: 'Oct', collected: 71000, expected: 75000 },
  { month: 'Nov', collected: 68000, expected: 72000 },
  { month: 'Dec', collected: 82000, expected: 85000 },
];

export const getLoanPortfolio = () => [
  { name: 'Personal Loan', value: 125000, color: 'hsl(173, 58%, 39%)' },
  { name: 'Business Loan', value: 180000, color: 'hsl(222, 47%, 20%)' },
  { name: 'Emergency Loan', value: 55000, color: 'hsl(38, 92%, 50%)' },
  { name: 'Asset Finance', value: 150000, color: 'hsl(158, 64%, 40%)' },
];

export const getLoanStatusDistribution = () => {
  const statusCounts = loans.reduce((acc, loan) => {
    acc[loan.status] = (acc[loan.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return [
    { name: 'Active', value: statusCounts['active'] || 0, color: 'hsl(173, 58%, 39%)' },
    { name: 'Paid', value: statusCounts['paid'] || 0, color: 'hsl(158, 64%, 40%)' },
    { name: 'Overdue', value: statusCounts['overdue'] || 0, color: 'hsl(0, 84%, 60%)' },
    { name: 'Pending', value: statusCounts['pending'] || 0, color: 'hsl(38, 92%, 50%)' },
  ].filter(item => item.value > 0);
};
