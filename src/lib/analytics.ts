import { supabase } from "@/integrations/supabase/client";

export type AnalyticsEventType = 
  | 'menu_view'
  | 'category_view'
  | 'product_view'
  | 'add_to_cart' 
  | 'remove_from_cart' 
  | 'order_sent'
  | 'table_session_started'
  | 'service_request_created'
  | 'service_request_completed'
  | 'promotion_view'
  | 'promotion_click'
  | 'upsell_view'
  | 'upsell_click';

export type AnalyticsEntityType = 'product' | 'category' | 'restaurant' | 'table' | 'promotion' | 'combo';

export interface AnalyticsEventParams {
  restaurant_id: string;
  event_type: AnalyticsEventType;
  entity_type?: AnalyticsEntityType;
  entity_id?: string;
  table_id?: string;
  metadata?: Record<string, any>;
}

// Generate or retrieve a persistent session ID (expires in 24 hours)
export function getAnalyticsSessionId(): string {
  const SESSION_KEY = "menuflow_analytics_session";
  const stored = localStorage.getItem(SESSION_KEY);
  
  if (stored) {
    try {
      const data = JSON.parse(stored);
      // Check if session is older than 24 hours
      if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
        return data.id;
      }
    } catch (e) {
      // JSON parse error, ignore and generate new
    }
  }

  // Generate new session
  const newId = crypto.randomUUID();
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    id: newId,
    timestamp: Date.now()
  }));
  
  return newId;
}

export function trackEvent({
  restaurant_id,
  event_type,
  entity_type,
  entity_id,
  table_id,
  metadata
}: AnalyticsEventParams) {
  if (!restaurant_id) return;

  const session_id = getAnalyticsSessionId();

  // Fire and forget, we don't want to block the UI
  supabase.from("analytics_events").insert({ 
    restaurant_id, 
    event_type,
    entity_type,
    entity_id,
    table_id,
    metadata_json: metadata,
    session_id
  }).then(() => {}).catch(console.error);
}
