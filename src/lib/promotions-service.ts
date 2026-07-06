import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PromotionType = 'banner' | 'combo' | 'happy_hour';

export interface Promotion {
  id: string;
  restaurant_id: string;
  title_en?: string | null;
  title_fr?: string | null;
  title_ar?: string | null;
  description_en?: string | null;
  description_fr?: string | null;
  description_ar?: string | null;
  type: PromotionType;
  is_active: boolean;
  start_date?: string | null;
  end_date?: string | null;
  metadata_json?: any;
  created_at: string;
  updated_at: string;
}

export interface ProductRecommendation {
  id: string;
  restaurant_id: string;
  primary_product_id: string;
  recommended_product_id: string;
  display_order: number;
  recommended_product?: any;
}

// ----------------------------------------------------
// PUBLIC HOOKS (For Menu)
// ----------------------------------------------------

export function useActivePromotions(restaurantId: string | undefined) {
  return useQuery({
    enabled: !!restaurantId,
    queryKey: ["public-promotions", restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .eq("restaurant_id", restaurantId!)
        .eq("is_active", true);

      if (error) throw error;
      
      // Filter out expired or future promotions manually just in case, though RLS does it too
      const now = new Date();
      return (data as Promotion[]).filter(p => {
        if (p.start_date && new Date(p.start_date) > now) return false;
        if (p.end_date && new Date(p.end_date) < now) return false;
        return true;
      });
    },
  });
}

export function useProductRecommendations(restaurantId: string | undefined, primaryProductId: string | undefined) {
  return useQuery({
    enabled: !!restaurantId && !!primaryProductId,
    queryKey: ["public-recommendations", restaurantId, primaryProductId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_recommendations")
        .select(`
          *,
          recommended_product:products!recommended_product_id(*)
        `)
        .eq("restaurant_id", restaurantId!)
        .eq("primary_product_id", primaryProductId!)
        .order("display_order");

      if (error) throw error;
      return data as ProductRecommendation[];
    },
  });
}

// ----------------------------------------------------
// ADMIN HOOKS (For Dashboard)
// ----------------------------------------------------

export function useAdminPromotions(restaurantId: string | undefined, type?: PromotionType) {
  return useQuery({
    enabled: !!restaurantId,
    queryKey: ["admin-promotions", restaurantId, type],
    queryFn: async () => {
      let query = supabase
        .from("promotions")
        .select("*")
        .eq("restaurant_id", restaurantId!)
        .order("created_at", { ascending: false });
        
      if (type) {
        query = query.eq("type", type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Promotion[];
    },
  });
}

export function useCreatePromotion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (promo: Partial<Promotion>) => {
      const { data, error } = await supabase
        .from("promotions")
        .insert(promo)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-promotions", data.restaurant_id] });
      queryClient.invalidateQueries({ queryKey: ["public-promotions", data.restaurant_id] });
    }
  });
}

export function useUpdatePromotion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Promotion> & { id: string }) => {
      const { data, error } = await supabase
        .from("promotions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-promotions", data.restaurant_id] });
      queryClient.invalidateQueries({ queryKey: ["public-promotions", data.restaurant_id] });
    }
  });
}

export function useDeletePromotion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, restaurant_id }: { id: string, restaurant_id: string }) => {
      const { error } = await supabase
        .from("promotions")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return restaurant_id;
    },
    onSuccess: (restaurant_id) => {
      queryClient.invalidateQueries({ queryKey: ["admin-promotions", restaurant_id] });
      queryClient.invalidateQueries({ queryKey: ["public-promotions", restaurant_id] });
    }
  });
}

export function useAdminRecommendations(restaurantId: string | undefined) {
  return useQuery({
    enabled: !!restaurantId,
    queryKey: ["admin-recommendations", restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_recommendations")
        .select(`
          *,
          primary_product:products!primary_product_id(name_en, name_fr, name_ar, image_url),
          recommended_product:products!recommended_product_id(name_en, name_fr, name_ar, image_url)
        `)
        .eq("restaurant_id", restaurantId!)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useCreateRecommendation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rec: Partial<ProductRecommendation>) => {
      const { data, error } = await supabase
        .from("product_recommendations")
        .insert(rec)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-recommendations", data.restaurant_id] });
      queryClient.invalidateQueries({ queryKey: ["public-recommendations", data.restaurant_id] });
    }
  });
}

export function useDeleteRecommendation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, restaurant_id }: { id: string, restaurant_id: string }) => {
      const { error } = await supabase
        .from("product_recommendations")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return restaurant_id;
    },
    onSuccess: (restaurant_id) => {
      queryClient.invalidateQueries({ queryKey: ["admin-recommendations", restaurant_id] });
      queryClient.invalidateQueries({ queryKey: ["public-recommendations", restaurant_id] });
    }
  });
}
