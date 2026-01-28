import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type FeePayment = Database['public']['Tables']['fees_payments']['Row'];
type FeePaymentInsert = Database['public']['Tables']['fees_payments']['Insert'];
type Repayment = Database['public']['Tables']['repayments']['Row'];
type RepaymentInsert = Database['public']['Tables']['repayments']['Insert'];
type LedgerEntry = Database['public']['Tables']['ledger_entries']['Row'];
type LedgerEntryInsert = Database['public']['Tables']['ledger_entries']['Insert'];

export function useFeePayments(loanId?: string) {
  return useQuery({
    queryKey: ['fee_payments', loanId],
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

export function useCreateFeePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payment: Omit<FeePaymentInsert, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('fees_payments')
        .insert(payment)
        .select()
        .single();

      if (error) throw error;
      return data as FeePayment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee_payments'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
    },
  });
}

export function useRepayments(loanId?: string) {
  return useQuery({
    queryKey: ['repayments', loanId],
    queryFn: async () => {
      let query = supabase
        .from('repayments')
        .select('*')
        .order('paid_at', { ascending: false });

      if (loanId) {
        query = query.eq('loan_id', loanId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Repayment[];
    },
  });
}

export function useCreateRepayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (repayment: Omit<RepaymentInsert, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('repayments')
        .insert(repayment)
        .select()
        .single();

      if (error) throw error;
      return data as Repayment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repayments'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
    },
  });
}

export function useLedgerEntries(startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ['ledger', startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from('ledger_entries')
        .select(`
          *,
          clients(id, first_name, last_name, client_number)
        `)
        .order('entry_date', { ascending: false });

      if (startDate) {
        query = query.gte('entry_date', startDate.toISOString().split('T')[0]);
      }
      if (endDate) {
        query = query.lte('entry_date', endDate.toISOString().split('T')[0]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateLedgerEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: Omit<LedgerEntryInsert, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('ledger_entries')
        .insert(entry)
        .select()
        .single();

      if (error) throw error;
      return data as LedgerEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
    },
  });
}
