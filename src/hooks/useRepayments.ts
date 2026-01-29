import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, Enums } from '@/integrations/supabase/types';

export type Repayment = Tables<'repayments'>;
export type RepaymentInsert = TablesInsert<'repayments'>;
export type PaymentMethod = Enums<'payment_method'>;

export type RepaymentWithLoan = Repayment & {
  loans: {
    id: string;
    loan_number: string;
    clients: {
      id: string;
      first_name: string;
      last_name: string;
    } | null;
  } | null;
};

export function useRepayments() {
  return useQuery({
    queryKey: ['repayments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('repayments')
        .select(`
          *,
          loans (
            id,
            loan_number,
            clients (
              id,
              first_name,
              last_name
            )
          )
        `)
        .order('paid_at', { ascending: false });

      if (error) throw error;
      return data as RepaymentWithLoan[];
    },
  });
}

export function useLoanRepayments(loanId: string | undefined) {
  return useQuery({
    queryKey: ['repayments', 'loan', loanId],
    queryFn: async () => {
      if (!loanId) return [];

      const { data, error } = await supabase
        .from('repayments')
        .select('*')
        .eq('loan_id', loanId)
        .order('paid_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!loanId,
  });
}

export function useCreateRepayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (repayment: RepaymentInsert) => {
      // Create the repayment
      const { data, error } = await supabase
        .from('repayments')
        .insert(repayment)
        .select()
        .single();

      if (error) throw error;

      // Update the loan's outstanding balance
      const { data: loan, error: loanError } = await supabase
        .from('loans')
        .select('outstanding_balance')
        .eq('id', repayment.loan_id)
        .single();

      if (loanError) throw loanError;

      const newBalance = Math.max(0, Number(loan.outstanding_balance) - repayment.amount);
      const newStatus = newBalance === 0 ? 'paid' : undefined;

      const updateData: Record<string, unknown> = { 
        outstanding_balance: newBalance,
      };
      
      if (newStatus) {
        updateData.status = newStatus;
        updateData.paid_at = new Date().toISOString();
      }

      await supabase
        .from('loans')
        .update(updateData)
        .eq('id', repayment.loan_id);

      // Create ledger entry
      await supabase
        .from('ledger_entries')
        .insert({
          loan_id: repayment.loan_id,
          entry_type: 'repayment',
          amount: repayment.amount,
          description: `Repayment via ${repayment.payment_method}`,
          reference_id: data.id,
        });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repayments'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['ledger-entries'] });
    },
  });
}
