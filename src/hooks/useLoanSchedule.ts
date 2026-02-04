import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LoanScheduleEntry {
  id: string;
  loan_id: string;
  installment_number: number;
  due_date: string;
  principal_portion: number;
  interest_portion: number;
  total_amount: number;
  status: string;
  paid_amount: number | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoanScheduleWithDetails extends LoanScheduleEntry {
  loans: {
    loan_number: string;
    clients: { first_name: string; last_name: string; client_number: string } | null;
  } | null;
}

export function useLoanSchedule(loanId?: string) {
  return useQuery({
    queryKey: ['loan_schedule', { loanId }],
    queryFn: async () => {
      let query = supabase
        .from('loan_schedule')
        .select(`
          *,
          loans(loan_number, clients(first_name, last_name, client_number))
        `)
        .order('due_date', { ascending: true });
      
      if (loanId) {
        query = query.eq('loan_id', loanId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as LoanScheduleWithDetails[];
    },
  });
}

export function useUpcomingInstallments(days: number = 30) {
  return useQuery({
    queryKey: ['loan_schedule', 'upcoming', days],
    queryFn: async () => {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      
      const { data, error } = await supabase
        .from('loan_schedule')
        .select(`
          *,
          loans(loan_number, clients(first_name, last_name, client_number))
        `)
        .eq('status', 'scheduled')
        .gte('due_date', today.toISOString().split('T')[0])
        .lte('due_date', futureDate.toISOString().split('T')[0])
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      return data as LoanScheduleWithDetails[];
    },
  });
}

export function useGenerateSchedule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (loanId: string) => {
      console.log('📅 Calling generate-repayment-schedule for loan:', loanId);
      
      const { data, error } = await supabase.functions.invoke('generate-repayment-schedule', {
        body: { loan_id: loanId },
      });
      
      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }
      
      console.log('📅 Schedule generation result:', data);
      return data;
    },
    onSuccess: (_, loanId) => {
      console.log('✅ Schedule generated, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['loan_schedule'] });
      queryClient.invalidateQueries({ queryKey: ['loan_schedule', { loanId }] });
    },
  });
}
