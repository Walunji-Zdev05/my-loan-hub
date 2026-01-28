import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      // Get all loans
      const { data: loans, error: loansError } = await supabase
        .from('loans')
        .select('*');

      if (loansError) throw loansError;

      // Get all clients
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id');

      if (clientsError) throw clientsError;

      // Get pending applications (applied status)
      const { data: pendingApps, error: pendingError } = await supabase
        .from('loans')
        .select('id')
        .eq('status', 'applied');

      if (pendingError) throw pendingError;

      const activeLoans = loans?.filter(l => l.status === 'active' || l.status === 'overdue') || [];
      const overdueLoans = loans?.filter(l => l.status === 'overdue') || [];
      
      const totalDisbursed = loans?.reduce((sum, l) => sum + (l.disbursed_at ? Number(l.principal_amount) : 0), 0) || 0;
      const outstandingBalance = loans?.reduce((sum, l) => sum + Number(l.outstanding_balance || 0), 0) || 0;
      const totalCollected = totalDisbursed - outstandingBalance;
      const collectionRate = totalDisbursed > 0 ? (totalCollected / totalDisbursed) * 100 : 0;

      return {
        totalDisbursed,
        outstandingBalance,
        overdueCount: overdueLoans.length,
        overdueAmount: overdueLoans.reduce((sum, l) => sum + Number(l.outstanding_balance || 0), 0),
        collectionRate: Math.round(collectionRate * 10) / 10,
        activeLoansCount: activeLoans.length,
        totalClients: clients?.length || 0,
        pendingApplications: pendingApps?.length || 0,
      };
    },
  });
}

export function useLoanStatusDistribution() {
  return useQuery({
    queryKey: ['dashboard', 'loan-status'],
    queryFn: async () => {
      const { data: loans, error } = await supabase
        .from('loans')
        .select('status');

      if (error) throw error;

      const statusCounts = (loans || []).reduce((acc, loan) => {
        acc[loan.status] = (acc[loan.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return [
        { name: 'Active', value: statusCounts['active'] || 0, color: 'hsl(173, 58%, 39%)' },
        { name: 'Overdue', value: statusCounts['overdue'] || 0, color: 'hsl(0, 84%, 60%)' },
        { name: 'Applied', value: statusCounts['applied'] || 0, color: 'hsl(38, 92%, 50%)' },
        { name: 'Approved', value: statusCounts['approved'] || 0, color: 'hsl(222, 47%, 50%)' },
      ].filter(item => item.value > 0);
    },
  });
}

export function useLoanPortfolioDistribution() {
  return useQuery({
    queryKey: ['dashboard', 'portfolio'],
    queryFn: async () => {
      const { data: loans, error } = await supabase
        .from('loans')
        .select(`
          outstanding_balance,
          loan_products(name)
        `)
        .in('status', ['active', 'overdue']);

      if (error) throw error;

      const portfolioByProduct: Record<string, number> = {};
      const colors = [
        'hsl(173, 58%, 39%)',
        'hsl(222, 47%, 20%)',
        'hsl(38, 92%, 50%)',
        'hsl(158, 64%, 40%)',
        'hsl(280, 60%, 50%)',
      ];

      (loans || []).forEach(loan => {
        const productName = loan.loan_products?.name || 'Unknown';
        portfolioByProduct[productName] = (portfolioByProduct[productName] || 0) + Number(loan.outstanding_balance || 0);
      });

      return Object.entries(portfolioByProduct).map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length],
      }));
    },
  });
}

export function usePendingApplications() {
  return useQuery({
    queryKey: ['dashboard', 'pending-applications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loans')
        .select(`
          *,
          clients(id, first_name, last_name, client_number),
          loan_products(id, name, application_fee, approval_fee)
        `)
        .eq('status', 'applied')
        .order('applied_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });
}
