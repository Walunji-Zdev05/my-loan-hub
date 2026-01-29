import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, Enums } from '@/integrations/supabase/types';

export type FeePayment = Tables<'fees_payments'>;
export type FeePaymentInsert = TablesInsert<'fees_payments'>;
export type FeeType = Enums<'fee_type'>;

export function useFeePayments(loanId?: string) {
  return useQuery({
    queryKey: ['fee-payments', loanId],
    queryFn: async () => {
      let query = supabase
        .from('fees_payments')
        .select('*')
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

export function useCreateFeePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payment: FeePaymentInsert) => {
      const { data, error } = await supabase
        .from('fees_payments')
        .insert(payment)
        .select()
        .single();

      if (error) throw error;

      // Create ledger entry
      await supabase
        .from('ledger_entries')
        .insert({
          loan_id: payment.loan_id,
          entry_type: payment.fee_type,
          amount: payment.amount,
          description: `${payment.fee_type.replace('_', ' ')} payment`,
          reference_id: data.id,
        });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-payments'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['ledger-entries'] });
    },
  });
}

// Check if a specific fee has been paid for a loan
export function useFeeStatus(loanId: string | undefined, feeType: FeeType) {
  return useQuery({
    queryKey: ['fee-status', loanId, feeType],
    queryFn: async () => {
      if (!loanId) return null;

      const { data, error } = await supabase
        .from('fees_payments')
        .select('*')
        .eq('loan_id', loanId)
        .eq('fee_type', feeType)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!loanId,
  });
}
