import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, Enums } from '@/integrations/supabase/types';

export type Repayment = Tables<'repayments'>;
export type RepaymentInsert = TablesInsert<'repayments'>;
export type PaymentMethod = Enums<'payment_method'>;

export function useRepayments(loanId?: string) {
  return useQuery({
    queryKey: ['repayments', { loanId }],
    queryFn: async () => {
      let query = supabase
        .from('repayments')
        .select(`
          *,
          loans (
            id, 
            loan_number, 
            clients (id, first_name, last_name, client_number)
          )
        `)
        .order('paid_at', { ascending: false });

      if (loanId) {
        query = query.eq('loan_id', loanId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });
}

export function useCreateRepayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (repaymentData: RepaymentInsert) => {
      // Create the repayment
      const { data: repayment, error: repaymentError } = await supabase
        .from('repayments')
        .insert(repaymentData)
        .select()
        .single();

      if (repaymentError) throw repaymentError;

      // Update the loan's outstanding balance
      const { data: loan, error: loanError } = await supabase
        .from('loans')
        .select('outstanding_balance')
        .eq('id', repaymentData.loan_id)
        .single();

      if (loanError) throw loanError;

      const newBalance = Math.max(0, loan.outstanding_balance - repaymentData.amount);
      
      const updates: Record<string, any> = {
        outstanding_balance: newBalance,
      };

      // If fully paid, update status
      if (newBalance === 0) {
        updates.status = 'paid';
        updates.paid_at = new Date().toISOString();
      }

      await supabase
        .from('loans')
        .update(updates)
        .eq('id', repaymentData.loan_id);

      // Create ledger entry for the repayment
      await supabase.from('ledger_entries').insert({
        entry_type: 'repayment',
        amount: repaymentData.amount,
        loan_id: repaymentData.loan_id,
        reference_id: repayment.id,
        description: `Repayment for loan`,
      });

      return repayment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repayments'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['ledger_entries'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
