import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRealtimeLoans() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('loans-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loans',
        },
        (payload) => {
          console.log('Loan change detected:', payload.eventType);
          // Invalidate all loan-related queries
          queryClient.invalidateQueries({ queryKey: ['loans'] });
          queryClient.invalidateQueries({ queryKey: ['loan_stats'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'repayments',
        },
        (payload) => {
          console.log('Repayment change detected:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ['repayments'] });
          queryClient.invalidateQueries({ queryKey: ['loans'] });
          queryClient.invalidateQueries({ queryKey: ['loan_stats'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clients',
        },
        (payload) => {
          console.log('Client change detected:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ['clients'] });
          queryClient.invalidateQueries({ queryKey: ['client_stats'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ledger_entries',
        },
        (payload) => {
          console.log('Ledger entry change detected:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ['ledger_entries'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

// Specific hook for Expected Loans page - listens to approved (pending disbursement) and active/disbursed loans
export function useRealtimeExpectedLoans() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('expected-loans-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'loans',
        },
        (payload) => {
          console.log('New loan created:', payload.new);
          queryClient.invalidateQueries({ queryKey: ['loans'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'loans',
        },
        (payload) => {
          const newStatus = (payload.new as { status?: string })?.status;
          console.log('Loan updated, new status:', newStatus);
          
          // Refresh queries when status changes to/from approved, disbursed, or active
          if (['approved', 'disbursed', 'active'].includes(newStatus || '')) {
            queryClient.invalidateQueries({ queryKey: ['loans'] });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'loans',
        },
        () => {
          console.log('Loan deleted');
          queryClient.invalidateQueries({ queryKey: ['loans'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
