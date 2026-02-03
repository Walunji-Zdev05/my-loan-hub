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

// Specific hook for Expected Loans page - listens to loans, repayments, and loan_schedule
export function useRealtimeExpectedLoans() {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('🔄 Setting up Expected Loans real-time subscriptions...');
    
    const channel = supabase
      .channel('expected-loans-realtime')
      // Loans table subscriptions
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'loans',
        },
        (payload) => {
          console.log('📋 New loan created:', payload.new);
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
          const oldStatus = (payload.old as { status?: string })?.status;
          console.log('📋 Loan updated:', { oldStatus, newStatus, payload: payload.new });
          
          // Refresh queries when status changes to/from approved, disbursed, or active
          if (['approved', 'disbursed', 'active'].includes(newStatus || '') ||
              ['approved', 'disbursed', 'active'].includes(oldStatus || '')) {
            console.log('🔄 Invalidating loans queries due to status change');
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
        (payload) => {
          console.log('📋 Loan deleted:', payload.old);
          queryClient.invalidateQueries({ queryKey: ['loans'] });
        }
      )
      // Repayments table subscriptions for real-time forecast updates
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'repayments',
        },
        (payload) => {
          console.log('💰 Repayment inserted:', payload.new);
          // Invalidate loans to recalculate outstanding balances and forecasts
          queryClient.invalidateQueries({ queryKey: ['loans'] });
          queryClient.invalidateQueries({ queryKey: ['repayments'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'repayments',
        },
        (payload) => {
          console.log('💰 Repayment updated:', payload.new);
          queryClient.invalidateQueries({ queryKey: ['loans'] });
          queryClient.invalidateQueries({ queryKey: ['repayments'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'repayments',
        },
        (payload) => {
          console.log('💰 Repayment deleted:', payload.old);
          queryClient.invalidateQueries({ queryKey: ['loans'] });
          queryClient.invalidateQueries({ queryKey: ['repayments'] });
        }
      )
      // Loan schedule subscriptions for real-time expected installments
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'loan_schedule',
        },
        (payload) => {
          console.log('📅 Loan schedule inserted:', payload.new);
          queryClient.invalidateQueries({ queryKey: ['loan_schedule'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'loan_schedule',
        },
        (payload) => {
          console.log('📅 Loan schedule updated:', payload.new);
          queryClient.invalidateQueries({ queryKey: ['loan_schedule'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'loan_schedule',
        },
        (payload) => {
          console.log('📅 Loan schedule deleted:', payload.old);
          queryClient.invalidateQueries({ queryKey: ['loan_schedule'] });
        }
      )
      .subscribe((status) => {
        console.log('📡 Expected Loans subscription status:', status);
      });

    return () => {
      console.log('🔌 Cleaning up Expected Loans real-time subscriptions');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
