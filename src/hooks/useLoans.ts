import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Loan = Database['public']['Tables']['loans']['Row'];
type LoanInsert = Database['public']['Tables']['loans']['Insert'];
type LoanUpdate = Database['public']['Tables']['loans']['Update'];
type LoanStatus = Database['public']['Enums']['loan_status'];

export interface LoanWithDetails extends Loan {
  clients: {
    id: string;
    first_name: string;
    last_name: string;
    client_number: string;
  } | null;
  loan_products: {
    id: string;
    name: string;
    application_fee: number;
    approval_fee: number;
  } | null;
}

export function useLoans(status?: LoanStatus | LoanStatus[]) {
  return useQuery({
    queryKey: ['loans', { status }],
    queryFn: async () => {
      let query = supabase
        .from('loans')
        .select(`
          *,
          clients(id, first_name, last_name, client_number),
          loan_products(id, name, application_fee, approval_fee)
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

export function useLoan(loanId: string | undefined) {
  return useQuery({
    queryKey: ['loans', loanId],
    queryFn: async () => {
      if (!loanId) return null;

      const { data, error } = await supabase
        .from('loans')
        .select(`
          *,
          clients(id, first_name, last_name, client_number, email, phone),
          loan_products(id, name, application_fee, approval_fee)
        `)
        .eq('id', loanId)
        .maybeSingle();

      if (error) throw error;
      return data as LoanWithDetails | null;
    },
    enabled: !!loanId,
  });
}

export function useCreateLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (loan: Omit<LoanInsert, 'id' | 'loan_number' | 'created_at' | 'updated_at'>) => {
      // Generate loan number
      const { data: loanNumber, error: numError } = await supabase
        .rpc('generate_loan_number');

      if (numError) throw numError;

      const { data, error } = await supabase
        .from('loans')
        .insert({
          ...loan,
          loan_number: loanNumber,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Loan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
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
      return data as Loan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
