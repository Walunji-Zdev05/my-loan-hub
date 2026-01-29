import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, Enums } from '@/integrations/supabase/types';

export type LedgerEntry = Tables<'ledger_entries'>;
export type LedgerEntryType = Enums<'ledger_entry_type'>;

export type LedgerEntryWithDetails = LedgerEntry & {
  loans: {
    id: string;
    loan_number: string;
    clients: {
      id: string;
      first_name: string;
      last_name: string;
      client_number: string;
    } | null;
  } | null;
};

export function useLedgerEntries(filters?: {
  entryType?: LedgerEntryType;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ['ledger-entries', filters],
    queryFn: async () => {
      let query = supabase
        .from('ledger_entries')
        .select(`
          *,
          loans (
            id,
            loan_number,
            clients (
              id,
              first_name,
              last_name,
              client_number
            )
          )
        `)
        .order('entry_date', { ascending: false });

      if (filters?.entryType) {
        query = query.eq('entry_type', filters.entryType);
      }
      if (filters?.startDate) {
        query = query.gte('entry_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('entry_date', filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as LedgerEntryWithDetails[];
    },
  });
}

export function useLedgerSummary(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['ledger-summary', startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('ledger_entries')
        .select('entry_type, amount');

      if (startDate) {
        query = query.gte('entry_date', startDate);
      }
      if (endDate) {
        query = query.lte('entry_date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calculate totals by entry type
      const summary = {
        application_fee: 0,
        approval_fee: 0,
        interest: 0,
        penalty: 0,
        repayment: 0,
        total: 0,
      };

      data.forEach((entry) => {
        const amount = Number(entry.amount);
        if (entry.entry_type in summary) {
          summary[entry.entry_type as keyof typeof summary] += amount;
        }
        summary.total += amount;
      });

      return summary;
    },
  });
}
