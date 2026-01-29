import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type LedgerEntry = Tables<'ledger_entries'>;

export type LedgerEntryWithDetails = LedgerEntry & {
  clients: { first_name: string; last_name: string; client_number: string } | null;
  loans: { loan_number: string } | null;
};

export function useLedgerEntries(options?: {
  startDate?: Date;
  endDate?: Date;
}) {
  return useQuery({
    queryKey: ['ledger_entries', options],
    queryFn: async () => {
      let query = supabase
        .from('ledger_entries')
        .select(`
          *,
          clients(first_name, last_name, client_number),
          loans(loan_number)
        `)
        .order('entry_date', { ascending: false });
      
      if (options?.startDate) {
        query = query.gte('entry_date', options.startDate.toISOString().split('T')[0]);
      }
      
      if (options?.endDate) {
        query = query.lte('entry_date', options.endDate.toISOString().split('T')[0]);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as LedgerEntryWithDetails[];
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
      
      const { data, error } = await supabase
        .from('ledger_entries')
        .select('entry_type, amount, entry_date');
      
      if (error) throw error;
      
      const monthlyIncome = data
        ?.filter(e => new Date(e.entry_date) >= startOfMonth)
        .reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      
      const yearlyIncome = data
        ?.filter(e => new Date(e.entry_date) >= startOfYear)
        .reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      
      const byType = data?.reduce((acc, e) => {
        acc[e.entry_type] = (acc[e.entry_type] || 0) + Number(e.amount);
        return acc;
      }, {} as Record<string, number>) || {};
      
      return {
        monthlyIncome,
        yearlyIncome,
        totalEntries: data?.length || 0,
        byType,
      };
    },
  });
}
