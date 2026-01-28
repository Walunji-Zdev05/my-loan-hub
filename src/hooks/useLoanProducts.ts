import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type LoanProduct = Database['public']['Tables']['loan_products']['Row'];
type LoanProductInsert = Database['public']['Tables']['loan_products']['Insert'];
type LoanProductUpdate = Database['public']['Tables']['loan_products']['Update'];

export function useLoanProducts(activeOnly = false) {
  return useQuery({
    queryKey: ['loan_products', { activeOnly }],
    queryFn: async () => {
      let query = supabase
        .from('loan_products')
        .select('*')
        .order('created_at', { ascending: false });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as LoanProduct[];
    },
  });
}

export function useCreateLoanProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: Omit<LoanProductInsert, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('loan_products')
        .insert(product)
        .select()
        .single();

      if (error) throw error;
      return data as LoanProduct;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan_products'] });
    },
  });
}

export function useUpdateLoanProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: LoanProductUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('loan_products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as LoanProduct;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan_products'] });
    },
  });
}
