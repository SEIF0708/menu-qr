
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
  currency TEXT NOT NULL DEFAULT 'USD',
  default_language TEXT NOT NULL DEFAULT 'en',
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
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

-- Public-safe view: excludes phone, owner_id, onboarding_completed
CREATE OR REPLACE VIEW public.restaurants_public AS
  SELECT id, name, slug, description, logo_url, cover_image_url,
         currency, default_language, created_at, updated_at
  FROM public.restaurants;

GRANT SELECT ON public.restaurants_public TO anon, authenticated;
ALTER VIEW public.restaurants_public SET (security_invoker = on);

-- Allow anon to read only the safe columns of restaurants (needed for the view)
GRANT SELECT (id, name, slug, description, logo_url, cover_image_url,
              currency, default_language, created_at, updated_at)
  ON public.restaurants TO anon;

DROP POLICY IF EXISTS anon_read_restaurants_safe ON public.restaurants;
CREATE POLICY anon_read_restaurants_safe ON public.restaurants
  FOR SELECT TO anon
  USING (true);
