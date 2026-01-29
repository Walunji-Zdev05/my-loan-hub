import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type LoanProduct = Tables<'loan_products'>;
export type LoanProductInsert = TablesInsert<'loan_products'>;
export type LoanProductUpdate = TablesUpdate<'loan_products'>;

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
      return data;
    },
  });
}

export function useCreateLoanProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productData: LoanProductInsert) => {
      const { data, error } = await supabase
        .from('loan_products')
        .insert(productData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan_products'] });
    },
  });
}

export function useUpdateLoanProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & LoanProductUpdate) => {
      const { data, error } = await supabase
        .from('loan_products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan_products'] });
    },
  });
}
