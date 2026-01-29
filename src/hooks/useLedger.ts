import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type LedgerEntry = Tables<'ledger_entries'>;

export function useLedgerEntries(startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ['ledger_entries', { startDate: startDate?.toISOString(), endDate: endDate?.toISOString() }],
    queryFn: async () => {
      let query = supabase
        .from('ledger_entries')
        .select(`
          *,
          clients (id, first_name, last_name, client_number),
          loans (id, loan_number)
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

export function useLedgerSummary() {
  return useQuery({
    queryKey: ['ledger_summary'],
    queryFn: async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      // Monthly total
      const { data: monthlyData } = await supabase
        .from('ledger_entries')
        .select('amount')
        .gte('entry_date', startOfMonth.toISOString().split('T')[0]);

      const monthlyTotal = monthlyData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      // Yearly total
      const { data: yearlyData } = await supabase
        .from('ledger_entries')
        .select('amount')
        .gte('entry_date', startOfYear.toISOString().split('T')[0]);

      const yearlyTotal = yearlyData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      return {
        monthlyTotal,
        yearlyTotal,
      };
    },
  });
}
