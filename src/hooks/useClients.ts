import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type Client = Tables<'clients'>;
export type ClientInsert = TablesInsert<'clients'>;
export type ClientStatus = 'pending' | 'approved' | 'rejected' | 'active';

export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Client[];
    },
  });
}

export function useClientsByStatus(status: ClientStatus | ClientStatus[]) {
  return useQuery({
    queryKey: ['clients', { status }],
    queryFn: async () => {
      let query = supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (Array.isArray(status)) {
        query = query.in('status', status);
      } else {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Client[];
    },
  });
}

// Get approved clients for loan applications
export function useApprovedClients() {
  return useQuery({
    queryKey: ['clients', { status: 'approved' }],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('status', 'approved')
        .order('first_name', { ascending: true });
      
      if (error) throw error;
      return data as Client[];
    },
  });
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Client;
    },
    enabled: !!id,
  });
}

export function useClientStats() {
  return useQuery({
    queryKey: ['client_stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('status');
      
      if (error) throw error;
      
      const pending = data?.filter(c => c.status === 'pending').length || 0;
      const approved = data?.filter(c => c.status === 'approved' || c.status === 'active').length || 0;
      const rejected = data?.filter(c => c.status === 'rejected').length || 0;
      
      return {
        total: data?.length || 0,
        pending,
        approved,
        rejected,
      };
    },
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (client: Omit<ClientInsert, 'client_number'>) => {
      // Generate client number
      const { data: clientNumber, error: genError } = await supabase
        .rpc('generate_client_number');
      
      if (genError) throw genError;
      
      const { data, error } = await supabase
        .from('clients')
        .insert({ ...client, client_number: clientNumber })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client_stats'] });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Client>) => {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients', data.id] });
      queryClient.invalidateQueries({ queryKey: ['client_stats'] });
    },
  });
}
