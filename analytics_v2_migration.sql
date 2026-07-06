-- Analytics V2 Migration

-- 1. Create the analytics_events table
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  table_id UUID,
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata_json JSONB DEFAULT '{}'::jsonb,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- If the table already existed (e.g. from V1), add the missing columns
ALTER TABLE public.analytics_events
  ADD COLUMN IF NOT EXISTS table_id UUID,
  ADD COLUMN IF NOT EXISTS entity_type TEXT,
  ADD COLUMN IF NOT EXISTS entity_id UUID,
  ADD COLUMN IF NOT EXISTS metadata_json JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS session_id TEXT;

-- Indices for faster querying
CREATE INDEX IF NOT EXISTS analytics_events_restaurant_idx ON public.analytics_events(restaurant_id);
CREATE INDEX IF NOT EXISTS analytics_events_created_at_idx ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_event_type_idx ON public.analytics_events(event_type);

-- RLS setup
GRANT SELECT, INSERT ON public.analytics_events TO anon;
GRANT SELECT, INSERT, DELETE ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO service_role;

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone_insert_analytics" ON public.analytics_events;
CREATE POLICY "anyone_insert_analytics" ON public.analytics_events FOR INSERT TO anon 
  WITH CHECK (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id));

DROP POLICY IF EXISTS "auth_insert_analytics" ON public.analytics_events;
CREATE POLICY "auth_insert_analytics" ON public.analytics_events FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id));

DROP POLICY IF EXISTS "owner_read_analytics" ON public.analytics_events;
CREATE POLICY "owner_read_analytics" ON public.analytics_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()));

DROP POLICY IF EXISTS "owner_delete_analytics" ON public.analytics_events;
CREATE POLICY "owner_delete_analytics" ON public.analytics_events FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()));


-- 2. Aggregation Views
-- Product Analytics View
CREATE OR REPLACE VIEW public.analytics_product_stats AS
SELECT 
  p.restaurant_id,
  p.id AS product_id,
  p.name_en,
  p.name_fr,
  p.name_ar,
  p.image_url,
  COUNT(ae.id) FILTER (WHERE ae.event_type = 'product_view') AS views,
  COUNT(ae.id) FILTER (WHERE ae.event_type = 'add_to_cart') AS cart_adds,
  COUNT(ae.id) FILTER (WHERE ae.event_type = 'order_sent') AS orders,
  COALESCE(
    (COUNT(ae.id) FILTER (WHERE ae.event_type = 'order_sent')::FLOAT / 
     NULLIF(COUNT(ae.id) FILTER (WHERE ae.event_type = 'product_view'), 0) * 100), 
  0) AS conversion_rate
FROM public.products p
LEFT JOIN public.analytics_events ae ON p.id = ae.entity_id AND ae.entity_type = 'product'
GROUP BY p.restaurant_id, p.id;

-- Category Analytics View
CREATE OR REPLACE VIEW public.analytics_category_stats AS
WITH category_views AS (
  SELECT entity_id AS category_id, COUNT(id) AS views
  FROM public.analytics_events
  WHERE event_type = 'category_view' AND entity_type = 'category'
  GROUP BY entity_id
),
product_metrics AS (
  SELECT 
    p.category_id,
    COUNT(ae.id) FILTER (WHERE ae.event_type = 'add_to_cart') AS cart_adds,
    COUNT(ae.id) FILTER (WHERE ae.event_type = 'order_sent') AS orders
  FROM public.products p
  JOIN public.analytics_events ae ON p.id = ae.entity_id AND ae.entity_type = 'product'
  GROUP BY p.category_id
)
SELECT 
  c.restaurant_id,
  c.id AS category_id,
  c.name_en,
  c.name_fr,
  c.name_ar,
  COALESCE(cv.views, 0) AS views,
  COALESCE(pm.cart_adds, 0) AS cart_adds,
  COALESCE(pm.orders, 0) AS orders
FROM public.categories c
LEFT JOIN category_views cv ON c.id = cv.category_id
LEFT JOIN product_metrics pm ON c.id = pm.category_id;

-- Table Analytics View
CREATE OR REPLACE VIEW public.analytics_table_stats WITH (security_invoker = on) AS
SELECT 
  t.restaurant_id,
  t.id AS table_id,
  t.name,
  t.table_number,
  (SELECT COUNT(*) FROM public.analytics_events ae WHERE ae.table_id = t.id AND ae.event_type = 'table_session_started') AS sessions,
  (SELECT COUNT(*) FROM public.orders o WHERE o.table_id = t.id) AS orders,
  (SELECT COUNT(*) FROM public.analytics_events ae WHERE ae.table_id = t.id AND ae.event_type = 'service_request_created') AS requests
FROM public.restaurant_tables t;

-- Hourly Analytics View
CREATE OR REPLACE VIEW public.analytics_hourly_stats AS
SELECT 
  restaurant_id,
  EXTRACT(DOW FROM created_at) AS day_of_week,
  EXTRACT(HOUR FROM created_at) AS hour_of_day,
  COUNT(*) AS total_events
FROM public.analytics_events
GROUP BY restaurant_id, EXTRACT(DOW FROM created_at), EXTRACT(HOUR FROM created_at);

-- Set permissions for views
GRANT SELECT ON public.analytics_product_stats TO authenticated;
GRANT SELECT ON public.analytics_category_stats TO authenticated;
GRANT SELECT ON public.analytics_table_stats TO authenticated;
GRANT SELECT ON public.analytics_hourly_stats TO authenticated;

-- Security Invoker for Views
ALTER VIEW public.analytics_product_stats SET (security_invoker = on);
ALTER VIEW public.analytics_category_stats SET (security_invoker = on);
ALTER VIEW public.analytics_table_stats SET (security_invoker = on);
ALTER VIEW public.analytics_hourly_stats SET (security_invoker = on);
