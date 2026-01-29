import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, Enums } from '@/integrations/supabase/types';

export type Repayment = Tables<'repayments'>;
export type RepaymentInsert = TablesInsert<'repayments'>;
export type PaymentMethod = Enums<'payment_method'>;

export type RepaymentWithLoan = Repayment & {
  loans: {
    loan_number: string;
    clients: { first_name: string; last_name: string } | null;
  } | null;
};

export function useRepayments(loanId?: string) {
  return useQuery({
    queryKey: ['repayments', { loanId }],
    queryFn: async () => {
      let query = supabase
        .from('repayments')
        .select(`
          *,
          loans(loan_number, clients(first_name, last_name))
        `)
        .order('paid_at', { ascending: false });
      
      if (loanId) {
        query = query.eq('loan_id', loanId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as RepaymentWithLoan[];
    },
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      loanId, 
      amount, 
      paymentMethod, 
      notes 
    }: { 
      loanId: string; 
      amount: number; 
      paymentMethod: PaymentMethod;
      notes?: string;
    }) => {
      // First, get the current loan to calculate portions
      const { data: loan, error: loanError } = await supabase
        .from('loans')
        .select('outstanding_balance, interest_rate, principal_amount, total_amount')
        .eq('id', loanId)
        .single();
      
      if (loanError) throw loanError;
      
      // Calculate simple interest/principal portions (simplified)
      const interestRatio = (Number(loan.total_amount) - Number(loan.principal_amount)) / Number(loan.total_amount);
      const interestPortion = Math.round(amount * interestRatio);
      const principalPortion = amount - interestPortion;
      
      // Insert repayment
      const { data: repayment, error: repaymentError } = await supabase
        .from('repayments')
        .insert({
          loan_id: loanId,
          amount,
          payment_method: paymentMethod,
          interest_portion: interestPortion,
          principal_portion: principalPortion,
          notes,
        })
        .select()
        .single();
      
      if (repaymentError) throw repaymentError;
      
      // Update loan outstanding balance
      const newBalance = Math.max(0, Number(loan.outstanding_balance) - amount);
      const newStatus = newBalance <= 0 ? 'paid' : undefined;
      
      const updateData: Record<string, unknown> = { outstanding_balance: newBalance };
      if (newStatus) {
        updateData.status = newStatus;
        updateData.paid_at = new Date().toISOString();
      }
      
      const { error: updateError } = await supabase
        .from('loans')
        .update(updateData)
        .eq('id', loanId);
      
      if (updateError) throw updateError;
      
      // Add ledger entry for repayment
      await supabase.from('ledger_entries').insert({
        loan_id: loanId,
        entry_type: 'repayment',
        amount,
        description: `Repayment via ${paymentMethod}`,
      });
      
      // Add ledger entry for interest
      if (interestPortion > 0) {
        await supabase.from('ledger_entries').insert({
          loan_id: loanId,
          entry_type: 'interest',
          amount: interestPortion,
          description: 'Interest collected',
        });
      }
      
      return repayment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repayments'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loan_stats'] });
      queryClient.invalidateQueries({ queryKey: ['ledger_entries'] });
    },
  });
}
