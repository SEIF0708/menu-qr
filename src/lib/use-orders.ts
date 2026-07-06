import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export function useOrders(restaurantId: string | undefined) {
  return useQuery({
    enabled: !!restaurantId,
    queryKey: ["orders", restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          table:restaurant_tables(name)
        `)
        .eq("restaurant_id", restaurantId!)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useSubmitOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      restaurant_id,
      table_id,
      items,
      total_amount
    }: {
      restaurant_id: string;
      table_id: string | null;
      items: any[];
      total_amount: number;
    }) => {
      const { error } = await supabase
        .from("orders")
        .insert({
          restaurant_id,
          table_id,
          items_json: items as unknown as Json,
          total_amount,
          whatsapp_sent: true
        });
        
      if (error) throw error;
      return { restaurant_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orders", data.restaurant_id] });
      queryClient.invalidateQueries({ queryKey: ["analytics-tables", data.restaurant_id] });
    }
  });
}
