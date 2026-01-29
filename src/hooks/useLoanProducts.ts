import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type LoanProduct = Tables<'loan_products'>;
export type LoanProductInsert = TablesInsert<'loan_products'>;
export type LoanProductUpdate = TablesUpdate<'loan_products'>;

export function useLoanProducts(activeOnly = false) {
  return useQuery({
    queryKey: ['loan-products', activeOnly],
    queryFn: async () => {
      let query = supabase
        .from('loan_products')
        .select('*')
        .order('name', { ascending: true });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });
}

export function useLoanProduct(productId: string | undefined) {
  return useQuery({
    queryKey: ['loan-products', productId],
    queryFn: async () => {
      if (!productId) return null;

      const { data, error } = await supabase
        .from('loan_products')
        .select('*')
        .eq('id', productId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });
}

export function useCreateLoanProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: LoanProductInsert) => {
      const { data, error } = await supabase
        .from('loan_products')
        .insert(product)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-products'] });
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
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['loan-products'] });
      queryClient.invalidateQueries({ queryKey: ['loan-products', data.id] });
    },
  });
}
