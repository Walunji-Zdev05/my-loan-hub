import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate, Enums } from '@/integrations/supabase/types';

export type Loan = Tables<'loans'>;
export type LoanInsert = TablesInsert<'loans'>;
export type LoanUpdate = TablesUpdate<'loans'>;
export type LoanStatus = Enums<'loan_status'>;

export type LoanWithDetails = Loan & {
  clients: {
    id: string;
    first_name: string;
    last_name: string;
    client_number: string;
    phone: string | null;
    email: string | null;
  };
  loan_products: {
    id: string;
    name: string;
    interest_rate: number;
    application_fee: number;
    approval_fee: number;
  };
};

export function useLoans(status?: LoanStatus | LoanStatus[]) {
  return useQuery({
    queryKey: ['loans', { status }],
    queryFn: async () => {
      let query = supabase
        .from('loans')
        .select(`
          *,
          clients (id, first_name, last_name, client_number, phone, email),
          loan_products (id, name, interest_rate, application_fee, approval_fee)
        `)
        .order('created_at', { ascending: false });

      if (status) {
        if (Array.isArray(status)) {
          query = query.in('status', status);
        } else {
          query = query.eq('status', status);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as LoanWithDetails[];
    },
  });
}

export function useLoan(loanId: string | undefined) {
  return useQuery({
    queryKey: ['loans', loanId],
    queryFn: async () => {
      if (!loanId) return null;
      
      const { data, error } = await supabase
        .from('loans')
        .select(`
          *,
          clients (id, first_name, last_name, client_number, phone, email),
          loan_products (id, name, interest_rate, application_fee, approval_fee)
        `)
        .eq('id', loanId)
        .maybeSingle();

      if (error) throw error;
      return data as LoanWithDetails | null;
    },
    enabled: !!loanId,
  });
}

export function useClientLoans(clientId: string | undefined) {
  return useQuery({
    queryKey: ['loans', { clientId }],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from('loans')
        .select(`
          *,
          clients (id, first_name, last_name, client_number, phone, email),
          loan_products (id, name, interest_rate, application_fee, approval_fee)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as LoanWithDetails[];
    },
    enabled: !!clientId,
  });
}

export function useCreateLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (loanData: Omit<LoanInsert, 'loan_number'>) => {
      // Generate loan number
      const { data: loanNumber } = await supabase.rpc('generate_loan_number');
      
      const { data, error } = await supabase
        .from('loans')
        .insert({
          ...loanData,
          loan_number: loanNumber || `L${Date.now()}`,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
    },
  });
}

export function useUpdateLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & LoanUpdate) => {
      const { data, error } = await supabase
        .from('loans')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
    },
  });
}

// Helper to calculate loan details
export function calculateLoanDetails(
  principalAmount: number,
  interestRate: number,
  termMonths: number,
  interestType: 'flat_rate' | 'reducing_balance'
) {
  let totalInterest: number;
  let monthlyPayment: number;

  if (interestType === 'flat_rate') {
    totalInterest = principalAmount * (interestRate / 100) * (termMonths / 12);
    monthlyPayment = (principalAmount + totalInterest) / termMonths;
  } else {
    // Reducing balance (PMT formula)
    const monthlyRate = interestRate / 100 / 12;
    monthlyPayment = principalAmount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
      (Math.pow(1 + monthlyRate, termMonths) - 1);
    totalInterest = (monthlyPayment * termMonths) - principalAmount;
  }

  return {
    totalAmount: principalAmount + totalInterest,
    monthlyPayment: Math.round(monthlyPayment),
    totalInterest: Math.round(totalInterest),
  };
}
