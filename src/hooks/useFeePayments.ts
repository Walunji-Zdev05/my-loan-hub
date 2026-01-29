import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, Enums } from '@/integrations/supabase/types';

export type FeePayment = Tables<'fees_payments'>;
export type FeePaymentInsert = TablesInsert<'fees_payments'>;
export type FeeType = Enums<'fee_type'>;
export type PaymentMethod = Enums<'payment_method'>;

export function useFeePayments(loanId?: string) {
  return useQuery({
    queryKey: ['fee_payments', { loanId }],
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
      return data as FeePayment[];
    },
  });
}

export function useRecordFeePayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      loanId,
      feeType,
      amount,
      paymentMethod,
      notes,
    }: {
      loanId: string;
      feeType: FeeType;
      amount: number;
      paymentMethod: PaymentMethod;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('fees_payments')
        .insert({
          loan_id: loanId,
          fee_type: feeType,
          amount,
          payment_method: paymentMethod,
          notes,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Get the loan's client_id for ledger entry
      const { data: loan } = await supabase
        .from('loans')
        .select('client_id')
        .eq('id', loanId)
        .single();
      
      // Add ledger entry
      await supabase.from('ledger_entries').insert({
        loan_id: loanId,
        client_id: loan?.client_id,
        entry_type: feeType,
        amount,
        description: `${feeType.replace('_', ' ')} payment`,
        reference_id: data.id,
      });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee_payments'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['ledger_entries'] });
    },
  });
}

// Check if a specific fee has been paid for a loan
export function useLoanFeeStatus(loanId: string | undefined) {
  return useQuery({
    queryKey: ['fee_payments', 'status', loanId],
    queryFn: async () => {
      if (!loanId) return { applicationFeePaid: false, approvalFeePaid: false };
      
      const { data, error } = await supabase
        .from('fees_payments')
        .select('fee_type')
        .eq('loan_id', loanId);
      
      if (error) throw error;
      
      const feeTypes = data?.map(f => f.fee_type) || [];
      
      return {
        applicationFeePaid: feeTypes.includes('application_fee'),
        approvalFeePaid: feeTypes.includes('approval_fee'),
      };
    },
    enabled: !!loanId,
  });
}
