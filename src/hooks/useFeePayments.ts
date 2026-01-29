import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, Enums } from '@/integrations/supabase/types';

export type FeePayment = Tables<'fees_payments'>;
export type FeePaymentInsert = TablesInsert<'fees_payments'>;
export type FeeType = Enums<'fee_type'>;

export function useFeePayments(loanId?: string) {
  return useQuery({
    queryKey: ['fees_payments', { loanId }],
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

export function useCheckFeePaid(loanId: string | undefined, feeType: FeeType) {
  return useQuery({
    queryKey: ['fees_payments', loanId, feeType],
    queryFn: async () => {
      if (!loanId) return false;
      
      const { data, error } = await supabase
        .from('fees_payments')
        .select('id')
        .eq('loan_id', loanId)
        .eq('fee_type', feeType)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!loanId,
  });
}

export function useCreateFeePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (feeData: FeePaymentInsert) => {
      const { data, error } = await supabase
        .from('fees_payments')
        .insert(feeData)
        .select()
        .single();

      if (error) throw error;

      // Create ledger entry
      await supabase.from('ledger_entries').insert({
        entry_type: feeData.fee_type as any,
        amount: feeData.amount,
        loan_id: feeData.loan_id,
        reference_id: data.id,
        description: `${feeData.fee_type.replace('_', ' ')} payment`,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees_payments'] });
      queryClient.invalidateQueries({ queryKey: ['ledger_entries'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
