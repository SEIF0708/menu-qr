import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useTables(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ["restaurant-tables", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      const { data, error } = await supabase
        .from("restaurant_tables")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("table_number", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!restaurantId,
  });
}

export function useCreateTable(restaurantId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (table: { name: string; table_number: number; qr_identifier: string }) => {
      if (!restaurantId) throw new Error("No restaurant ID");
      const { data, error } = await supabase
        .from("restaurant_tables")
        .insert({ ...table, restaurant_id: restaurantId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant-tables", restaurantId] });
    },
  });
}

export function useUpdateTable(restaurantId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (table: { id: string; name?: string; table_number?: number; is_active?: boolean }) => {
      const { id, ...updates } = table;
      const { data, error } = await supabase
        .from("restaurant_tables")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant-tables", restaurantId] });
    },
  });
}

export function useDeleteTable(restaurantId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("restaurant_tables").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant-tables", restaurantId] });
    },
  });
}
