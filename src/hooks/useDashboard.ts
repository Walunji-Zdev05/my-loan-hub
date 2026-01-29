import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      // Get all loans
      const { data: loans } = await supabase
        .from('loans')
        .select('status, principal_amount, outstanding_balance, total_amount');

      // Get clients count
      const { count: clientCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });

      // Get pending applications count
      const { count: pendingApplications } = await supabase
        .from('loans')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'applied');

      const activeLoans = loans?.filter(l => l.status === 'active' || l.status === 'disbursed') || [];
      const overdueLoans = loans?.filter(l => l.status === 'overdue') || [];
      const allLoans = loans || [];

      const totalDisbursed = allLoans.reduce((sum, l) => sum + Number(l.principal_amount), 0);
      const outstandingBalance = allLoans.reduce((sum, l) => sum + Number(l.outstanding_balance), 0);
      const overdueAmount = overdueLoans.reduce((sum, l) => sum + Number(l.outstanding_balance), 0);

      const totalCollected = totalDisbursed - outstandingBalance;
      const collectionRate = totalDisbursed > 0 ? (totalCollected / totalDisbursed) * 100 : 0;

      return {
        totalDisbursed,
        outstandingBalance,
        overdueCount: overdueLoans.length,
        overdueAmount,
        collectionRate: Math.round(collectionRate * 10) / 10,
        activeLoansCount: activeLoans.length,
        totalClients: clientCount || 0,
        pendingApplications: pendingApplications || 0,
      };
    },
  });
}

export function useLoanPortfolioDistribution() {
  return useQuery({
    queryKey: ['dashboard', 'portfolio'],
    queryFn: async () => {
      const { data: loans } = await supabase
        .from('loans')
        .select(`
          outstanding_balance,
          loan_products (name)
        `)
        .in('status', ['active', 'disbursed', 'overdue']);

      const portfolio: Record<string, number> = {};
      
      loans?.forEach(loan => {
        const productName = loan.loan_products?.name || 'Unknown';
        portfolio[productName] = (portfolio[productName] || 0) + Number(loan.outstanding_balance);
      });

      const colors = [
        'hsl(173, 58%, 39%)',
        'hsl(222, 47%, 20%)',
        'hsl(38, 92%, 50%)',
        'hsl(158, 64%, 40%)',
      ];

      return Object.entries(portfolio).map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length],
      }));
    },
  });
}

export function useLoanStatusDistribution() {
  return useQuery({
    queryKey: ['dashboard', 'status'],
    queryFn: async () => {
      const { data: loans } = await supabase
        .from('loans')
        .select('status');

      const statusCounts: Record<string, number> = {};
      
      loans?.forEach(loan => {
        statusCounts[loan.status] = (statusCounts[loan.status] || 0) + 1;
      });

      const statusConfig: Record<string, { color: string; label: string }> = {
        active: { color: 'hsl(173, 58%, 39%)', label: 'Active' },
        disbursed: { color: 'hsl(158, 64%, 40%)', label: 'Disbursed' },
        paid: { color: 'hsl(142, 71%, 45%)', label: 'Paid' },
        overdue: { color: 'hsl(0, 84%, 60%)', label: 'Overdue' },
        applied: { color: 'hsl(38, 92%, 50%)', label: 'Applied' },
        approved: { color: 'hsl(222, 47%, 50%)', label: 'Approved' },
      };

      return Object.entries(statusCounts)
        .filter(([status]) => status !== 'paid' && status !== 'rejected')
        .map(([status, count]) => ({
          name: statusConfig[status]?.label || status,
          value: count,
          color: statusConfig[status]?.color || 'hsl(var(--muted))',
        }));
    },
  });
}
