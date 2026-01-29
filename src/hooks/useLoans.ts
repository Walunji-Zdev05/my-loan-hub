import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate, Enums } from '@/integrations/supabase/types';

export type Loan = Tables<'loans'>;
export type LoanInsert = TablesInsert<'loans'>;
export type LoanUpdate = TablesUpdate<'loans'>;
export type LoanStatus = Enums<'loan_status'>;

export type LoanWithClient = Loan & {
  clients: {
    id: string;
    first_name: string;
    last_name: string;
    client_number: string;
    phone: string | null;
    email: string | null;
  } | null;
  loan_products: {
    id: string;
    name: string;
    interest_rate: number;
    application_fee: number;
    approval_fee: number;
  } | null;
};

export function useLoans(status?: LoanStatus | LoanStatus[]) {
  return useQuery({
    queryKey: ['loans', status],
    queryFn: async () => {
      let query = supabase
        .from('loans')
        .select(`
          *,
          clients (
            id,
            first_name,
            last_name,
            client_number,
            phone,
            email
          ),
          loan_products (
            id,
            name,
            interest_rate,
            application_fee,
            approval_fee
          )
        `)
        .order('created_at', { ascending: false });

      if (status) {
        if (Array.isArray(status)) {
          query = query.in('status', status);
        } else {
          query = query.eq('status', status);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as LoanWithClient[];
    },
  });
}

export function useLoan(loanId: string | undefined) {
  return useQuery({
    queryKey: ['loans', loanId],
    queryFn: async () => {
      if (!loanId) return null;

      const { data, error } = await supabase
        .from('loans')
        .select(`
          *,
          clients (
            id,
            first_name,
            last_name,
            client_number,
            phone,
            email,
            address,
            occupation,
            employer
          ),
          loan_products (
            id,
            name,
            interest_rate,
            interest_type,
            application_fee,
            approval_fee
          )
        `)
        .eq('id', loanId)
        .maybeSingle();

      if (error) throw error;
      return data as LoanWithClient;
    },
    enabled: !!loanId,
  });
}

export function useClientLoans(clientId: string | undefined) {
  return useQuery({
    queryKey: ['loans', 'client', clientId],
    queryFn: async () => {
      if (!clientId) return [];

      const { data, error } = await supabase
        .from('loans')
        .select(`
          *,
          loan_products (
            id,
            name,
            interest_rate
          )
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });
}

export function useCreateLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (loan: Omit<LoanInsert, 'loan_number'>) => {
      // Generate loan number
      const { data: loanNumber, error: numError } = await supabase
        .rpc('generate_loan_number');

      if (numError) throw numError;

      const { data, error } = await supabase
        .from('loans')
        .insert({ ...loan, loan_number: loanNumber })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
    },
  });
}

export function useUpdateLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: LoanUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('loans')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loans', data.id] });
    },
  });
}

// Dashboard stats
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [loansResult, clientsResult, repaymentsResult] = await Promise.all([
        supabase.from('loans').select('*'),
        supabase.from('clients').select('id'),
        supabase.from('repayments').select('amount'),
      ]);

      if (loansResult.error) throw loansResult.error;
      if (clientsResult.error) throw clientsResult.error;
      if (repaymentsResult.error) throw repaymentsResult.error;

      const loans = loansResult.data || [];
      const clients = clientsResult.data || [];
      const repayments = repaymentsResult.data || [];

      const activeLoans = loans.filter(l => l.status === 'active' || l.status === 'overdue' || l.status === 'disbursed');
      const overdueLoans = loans.filter(l => l.status === 'overdue');
      const pendingApplications = loans.filter(l => l.status === 'applied');

      const totalDisbursed = loans
        .filter(l => ['active', 'overdue', 'paid', 'disbursed'].includes(l.status))
        .reduce((sum, l) => sum + Number(l.principal_amount), 0);
      
      const outstandingBalance = loans.reduce((sum, l) => sum + Number(l.outstanding_balance), 0);
      const overdueAmount = overdueLoans.reduce((sum, l) => sum + Number(l.outstanding_balance), 0);
      const totalCollected = repayments.reduce((sum, r) => sum + Number(r.amount), 0);
      const collectionRate = totalDisbursed > 0 ? (totalCollected / totalDisbursed) * 100 : 0;

      return {
        totalDisbursed,
        outstandingBalance,
        overdueCount: overdueLoans.length,
        overdueAmount,
        collectionRate: Math.round(collectionRate * 10) / 10,
        activeLoansCount: activeLoans.length,
        totalClients: clients.length,
        pendingApplications: pendingApplications.length,
      };
    },
  });
}
