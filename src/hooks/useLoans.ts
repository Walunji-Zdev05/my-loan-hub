import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate, Enums } from '@/integrations/supabase/types';

export type Loan = Tables<'loans'>;
export type LoanInsert = TablesInsert<'loans'>;
export type LoanUpdate = TablesUpdate<'loans'>;
export type LoanStatus = Enums<'loan_status'>;

export type LoanWithDetails = Loan & {
  clients: { first_name: string; last_name: string; client_number: string; id_number: string | null; email: string | null } | null;
  loan_products: { name: string; application_fee: number; approval_fee: number } | null;
};

export function useLoans(status?: LoanStatus | LoanStatus[]) {
  return useQuery({
    queryKey: ['loans', { status }],
    queryFn: async () => {
      let query = supabase
        .from('loans')
        .select(`
          *,
          clients(first_name, last_name, client_number, id_number, email),
          loan_products(name, application_fee, approval_fee)
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
      return data as LoanWithDetails[];
    },
  });
}

export function useLoan(id: string | undefined) {
  return useQuery({
    queryKey: ['loans', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('loans')
        .select(`
          *,
          clients(first_name, last_name, client_number, id_number, phone, email),
          loan_products(name, application_fee, approval_fee)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateLoan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (loan: Omit<LoanInsert, 'loan_number'>) => {
      // Generate loan number
      const { data: loanNumber, error: genError } = await supabase
        .rpc('generate_loan_number');
      
      if (genError) throw genError;
      
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
    mutationFn: async ({ id, ...updates }: { id: string } & LoanUpdate) => {
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

// Get loans for dashboard stats
export function useLoanStats() {
  return useQuery({
    queryKey: ['loan_stats'],
    queryFn: async () => {
      const { data: loans, error } = await supabase
        .from('loans')
        .select('status, principal_amount, outstanding_balance, total_amount');
      
      if (error) throw error;
      
      const activeLoans = loans?.filter(l => l.status === 'active' || l.status === 'disbursed') || [];
      const overdueLoans = loans?.filter(l => l.status === 'overdue') || [];
      const paidLoans = loans?.filter(l => l.status === 'paid') || [];
      
      const totalDisbursed = loans?.reduce((sum, l) => sum + Number(l.principal_amount || 0), 0) || 0;
      const outstandingBalance = loans?.reduce((sum, l) => sum + Number(l.outstanding_balance || 0), 0) || 0;
      const overdueAmount = overdueLoans.reduce((sum, l) => sum + Number(l.outstanding_balance || 0), 0);
      const totalCollected = totalDisbursed - outstandingBalance;
      const collectionRate = totalDisbursed > 0 ? (totalCollected / totalDisbursed) * 100 : 0;
      
      return {
        totalDisbursed,
        outstandingBalance,
        overdueCount: overdueLoans.length,
        overdueAmount,
        collectionRate: Math.round(collectionRate * 10) / 10,
        activeLoansCount: activeLoans.length,
        paidLoansCount: paidLoans.length,
        totalLoansCount: loans?.length || 0,
      };
    },
  });
}
