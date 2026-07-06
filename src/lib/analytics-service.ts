import { supabase } from "@/integrations/supabase/client";

export interface TopProduct {
  product_id: string;
  name_en: string;
  name_fr: string;
  name_ar: string;
  image_url: string;
  views: number;
  cart_adds: number;
  orders: number;
  conversion_rate: number;
}

export interface TopCategory {
  category_id: string;
  name_en: string;
  name_fr: string;
  name_ar: string;
  views: number;
  cart_adds: number;
  orders: number;
}

export interface TableStats {
  table_id: string;
  name: string;
  table_number: number;
  sessions: number;
  orders: number;
  requests: number;
}

export interface PromotionStats {
  promotion_id: string;
  title_en: string;
  title_fr: string;
  title_ar: string;
  type: string;
  clicks: number;
}

export interface TimeStats {
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  hour_of_day: number; // 0-23
  total_events: number;
}

export async function getAnalyticsOverview(restaurantId: string) {
  const [viewsRes, ordersRes] = await Promise.all([
    supabase
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('restaurant_id', restaurantId)
      .eq('event_type', 'menu_view'),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('restaurant_id', restaurantId)
  ]);

  return { 
    views: viewsRes.count || 0, 
    orders: ordersRes.count || 0 
  };
}

export async function getTopProducts(restaurantId: string): Promise<TopProduct[]> {
  const { data, error } = await supabase
    .from('analytics_product_stats')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('views', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error("getTopProducts error:", error);
    return [];
  }
  return data as TopProduct[];
}

export async function getTopCategories(restaurantId: string): Promise<TopCategory[]> {
  const { data, error } = await supabase
    .from('analytics_category_stats')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('views', { ascending: false })
    .limit(10);
    
  if (error) {
    console.error("getTopCategories error:", error);
    return [];
  }
  return data as TopCategory[];
}

export async function getActiveTables(restaurantId: string): Promise<TableStats[]> {
  const { data, error } = await supabase
    .from('analytics_table_stats')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('sessions', { ascending: false })
    .limit(10);
    
  if (error) {
    console.error("getActiveTables error:", error);
    return [];
  }
  return data as TableStats[];
}

export async function getPromotionStats(restaurantId: string): Promise<PromotionStats[]> {
  const { data, error } = await supabase
    .from('analytics_promotion_stats')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('clicks', { ascending: false });
    
  if (error) {
    console.error("getPromotionStats error:", error);
    return [];
  }
  return data as PromotionStats[];
}

export async function getTimeAnalytics(restaurantId: string): Promise<TimeStats[]> {
  const { data, error } = await supabase
    .from('analytics_hourly_stats')
    .select('*')
    .eq('restaurant_id', restaurantId);
    
  if (error) {
    console.error("getTimeAnalytics error:", error);
    return [];
  }
  return data as TimeStats[];
}
