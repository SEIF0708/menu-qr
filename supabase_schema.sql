
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_profile_select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own_profile_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own_profile_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Restaurants
CREATE TABLE public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Restaurant',
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  phone TEXT,
  cuisine_type TEXT,
  is_open BOOLEAN NOT NULL DEFAULT true,
  opening_hours TEXT,
  website TEXT,
  email TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  currency TEXT NOT NULL DEFAULT 'TND',
  default_language TEXT NOT NULL DEFAULT 'en',
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  subscription_status TEXT NOT NULL DEFAULT 'unpaid',
  referral_code_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX restaurants_owner_idx ON public.restaurants(owner_id);
CREATE INDEX restaurants_slug_idx ON public.restaurants(slug);
GRANT SELECT ON public.restaurants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurants TO authenticated;
GRANT ALL ON public.restaurants TO service_role;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_restaurants" ON public.restaurants FOR SELECT TO anon USING (true);
CREATE POLICY "auth_read_restaurants" ON public.restaurants FOR SELECT TO authenticated USING (true);
CREATE POLICY "owner_insert_restaurant" ON public.restaurants FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "owner_update_restaurant" ON public.restaurants FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "owner_delete_restaurant" ON public.restaurants FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name_ar TEXT,
  name_fr TEXT,
  name_en TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX categories_restaurant_idx ON public.categories(restaurant_id);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_categories" ON public.categories FOR SELECT TO anon USING (true);
CREATE POLICY "auth_read_categories" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "owner_manage_categories" ON public.categories FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()));

-- Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name_ar TEXT,
  name_fr TEXT,
  name_en TEXT,
  description_ar TEXT,
  description_fr TEXT,
  description_en TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  featured BOOLEAN NOT NULL DEFAULT false,
  popular BOOLEAN NOT NULL DEFAULT false,
  chef_recommendation BOOLEAN NOT NULL DEFAULT false,
  badges TEXT[] DEFAULT '{}'::text[],
  prep_time_minutes INT,
  calories INT,
  ingredients TEXT,
  allergens TEXT,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX products_restaurant_idx ON public.products(restaurant_id);
CREATE INDEX products_category_idx ON public.products(category_id);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_products" ON public.products FOR SELECT TO anon USING (true);
CREATE POLICY "auth_read_products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "owner_manage_products" ON public.products FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()));

-- Menu views
CREATE TABLE public.menu_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX menu_views_restaurant_idx ON public.menu_views(restaurant_id, viewed_at DESC);
GRANT SELECT, INSERT ON public.menu_views TO anon;
GRANT SELECT, INSERT ON public.menu_views TO authenticated;
GRANT ALL ON public.menu_views TO service_role;
ALTER TABLE public.menu_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_insert_view" ON public.menu_views FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "auth_insert_view" ON public.menu_views FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "owner_read_views" ON public.menu_views FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()));

-- Trigger: auto-create profile + restaurant on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 0;
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;

  base_slug := lower(regexp_replace(split_part(NEW.email, '@', 1), '[^a-z0-9]+', '-', 'g'));
  IF base_slug = '' OR base_slug IS NULL THEN base_slug := 'restaurant'; END IF;
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.restaurants WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter::text;
  END LOOP;

  INSERT INTO public.restaurants (owner_id, name, slug)
  VALUES (NEW.id, 'My Restaurant', final_slug);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER restaurants_updated_at BEFORE UPDATE ON public.restaurants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Harden the signup function (security linter)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 0;
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;

  base_slug := lower(regexp_replace(split_part(NEW.email, '@', 1), '[^a-z0-9]+', '-', 'g'));
  IF base_slug = '' OR base_slug IS NULL THEN base_slug := 'restaurant'; END IF;
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.restaurants WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter::text;
  END LOOP;

  INSERT INTO public.restaurants (owner_id, name, slug)
  VALUES (NEW.id, 'My Restaurant', final_slug);
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Create Storage Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('restaurant-assets', 'restaurant-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for restaurant-assets bucket
-- Path convention: {owner_id}/{kind}/{filename}
DROP POLICY IF EXISTS "public_read_restaurant_assets" ON storage.objects;
DROP POLICY IF EXISTS "owner_upload_restaurant_assets" ON storage.objects;
DROP POLICY IF EXISTS "owner_update_restaurant_assets" ON storage.objects;
DROP POLICY IF EXISTS "owner_delete_restaurant_assets" ON storage.objects;

CREATE POLICY "public_read_restaurant_assets" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'restaurant-assets');
CREATE POLICY "owner_upload_restaurant_assets" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'restaurant-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "owner_update_restaurant_assets" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'restaurant-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "owner_delete_restaurant_assets" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'restaurant-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "anyone_insert_view" ON public.menu_views;
DROP POLICY IF EXISTS "auth_insert_view" ON public.menu_views;
CREATE POLICY "anyone_insert_view" ON public.menu_views FOR INSERT TO anon
  WITH CHECK (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id));
CREATE POLICY "auth_insert_view" ON public.menu_views FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id));
-- Restrict restaurants base table; expose safe columns via a public view
DROP POLICY IF EXISTS public_read_restaurants ON public.restaurants;
DROP POLICY IF EXISTS auth_read_restaurants ON public.restaurants;

REVOKE SELECT ON public.restaurants FROM anon;

DROP POLICY IF EXISTS owner_read_restaurant ON public.restaurants;
CREATE POLICY owner_read_restaurant ON public.restaurants
  FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);

-- Public-safe view: excludes phone, owner_id, onboarding_completed, referral_code_id
DROP VIEW IF EXISTS public.restaurants_public;
CREATE VIEW public.restaurants_public WITH (security_invoker = on) AS
  SELECT id, name, slug, description, logo_url, cover_image_url,
         cuisine_type, is_open, opening_hours, website, email, social_links,
         currency, default_language, subscription_status, created_at, updated_at
  FROM public.restaurants;

GRANT SELECT ON public.restaurants_public TO anon, authenticated;
ALTER VIEW public.restaurants_public SET (security_invoker = on);

-- Allow anon to read only the safe columns of restaurants (needed for the view)
GRANT SELECT (id, name, slug, description, logo_url, cover_image_url,
              cuisine_type, is_open, opening_hours, website, email, social_links,
              currency, default_language, subscription_status, created_at, updated_at)
  ON public.restaurants TO anon;

DROP POLICY IF EXISTS anon_read_restaurants_safe ON public.restaurants;
CREATE POLICY anon_read_restaurants_safe ON public.restaurants
  FOR SELECT TO anon
  USING (true);

-- ==========================================
-- MIGRATION COMMANDS FOR MENU V2 (Copy and run in SQL Editor)
-- ==========================================
/*
ALTER TABLE public.restaurants 
  ADD COLUMN IF NOT EXISTS cuisine_type TEXT,
  ADD COLUMN IF NOT EXISTS is_open BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS opening_hours TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS popular BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS chef_recommendation BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS badges TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS prep_time_minutes INT,
  ADD COLUMN IF NOT EXISTS calories INT,
  ADD COLUMN IF NOT EXISTS ingredients TEXT,
  ADD COLUMN IF NOT EXISTS allergens TEXT;

-- Recreate view and grants
DROP VIEW IF EXISTS public.restaurants_public;

CREATE VIEW public.restaurants_public WITH (security_invoker = on) AS
  SELECT id, name, slug, description, logo_url, cover_image_url,
         cuisine_type, is_open, opening_hours, website, email, social_links,
         currency, default_language, subscription_status, created_at, updated_at
  FROM public.restaurants;

GRANT SELECT (id, name, slug, description, logo_url, cover_image_url,
              cuisine_type, is_open, opening_hours, website, email, social_links,
              currency, default_language, subscription_status, created_at, updated_at)
  ON public.restaurants TO anon;
*/

-- ==========================================
-- REFERRALS & PAYMENTS SYSTEM
-- ==========================================
CREATE TABLE public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  referrer_name TEXT NOT NULL,
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 20.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.referral_codes TO authenticated;
GRANT ALL ON public.referral_codes TO service_role;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_read_referral_codes" ON public.referral_codes FOR SELECT TO authenticated USING (true);
CREATE POLICY "users_insert_own_referral_code" ON public.referral_codes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.restaurants ADD CONSTRAINT fk_restaurant_referral FOREIGN KEY (referral_code_id) REFERENCES public.referral_codes(id) ON DELETE SET NULL;

CREATE TABLE public.referral_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id UUID NOT NULL REFERENCES public.referral_codes(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);
GRANT SELECT ON public.referral_payouts TO authenticated;
GRANT ALL ON public.referral_payouts TO service_role;
ALTER TABLE public.referral_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_payouts" ON public.referral_payouts FOR ALL TO authenticated USING (true);

-- Analytics V2 Migration

-- 1. Create the analytics_events table
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  table_id UUID, -- REFERENCES public.restaurant_tables(id) ON DELETE SET NULL, -- No foreign key constraint if table doesn't exist yet, we'll keep it loose or add if needed. Assuming restaurant_tables exists from Table Management migration.
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

CREATE POLICY "anyone_insert_analytics" ON public.analytics_events FOR INSERT TO anon 
  WITH CHECK (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id));

CREATE POLICY "auth_insert_analytics" ON public.analytics_events FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id));

CREATE POLICY "owner_read_analytics" ON public.analytics_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()));

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
CREATE OR REPLACE VIEW public.analytics_table_stats AS
SELECT 
  t.restaurant_id,
  t.id AS table_id,
  t.name,
  t.table_number,
  COUNT(ae.id) FILTER (WHERE ae.event_type = 'table_session_started') AS sessions,
  COUNT(ae.id) FILTER (WHERE ae.event_type = 'order_sent') AS orders,
  COUNT(ae.id) FILTER (WHERE ae.event_type = 'service_request_created') AS requests
FROM public.restaurant_tables t
LEFT JOIN public.analytics_events ae ON t.id = ae.table_id
GROUP BY t.restaurant_id, t.id;

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
