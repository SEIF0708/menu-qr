-- 1. Add WhatsApp Phone to Restaurants
ALTER TABLE public.restaurants 
  ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT;

-- Recreate view to include whatsapp_phone
DROP VIEW IF EXISTS public.restaurants_public;
CREATE VIEW public.restaurants_public WITH (security_invoker = on) AS
  SELECT id, name, slug, description, logo_url, cover_image_url,
         cuisine_type, is_open, opening_hours, website, email, social_links,
         currency, default_language, subscription_status, created_at, updated_at,
         table_count, whatsapp_phone
  FROM public.restaurants;

GRANT SELECT ON public.restaurants_public TO anon, authenticated;
GRANT SELECT (id, name, slug, description, logo_url, cover_image_url,
              cuisine_type, is_open, opening_hours, website, email, social_links,
              currency, default_language, subscription_status, created_at, updated_at,
              table_count, whatsapp_phone)
  ON public.restaurants TO anon;

-- 2. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  table_id UUID REFERENCES public.restaurant_tables(id) ON DELETE SET NULL,
  items_json JSONB NOT NULL,
  total_amount NUMERIC NOT NULL,
  whatsapp_sent BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_restaurant_idx ON public.orders(restaurant_id);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_read_orders" ON public.orders;
CREATE POLICY "owner_read_orders" ON public.orders FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()));
DROP POLICY IF EXISTS "anyone_insert_orders" ON public.orders;
CREATE POLICY "anyone_insert_orders" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);

GRANT SELECT, INSERT ON public.orders TO anon, authenticated;
GRANT ALL ON public.orders TO service_role;

-- 3. Analytics Events Table
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS analytics_events_restaurant_idx ON public.analytics_events(restaurant_id, event_type);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_read_events" ON public.analytics_events;
CREATE POLICY "owner_read_events" ON public.analytics_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()));
DROP POLICY IF EXISTS "anyone_insert_events" ON public.analytics_events;
CREATE POLICY "anyone_insert_events" ON public.analytics_events FOR INSERT TO anon, authenticated WITH CHECK (true);

GRANT SELECT, INSERT ON public.analytics_events TO anon, authenticated;
GRANT ALL ON public.analytics_events TO service_role;
