-- Restrict restaurants base table; expose safe columns via a public view
DROP POLICY IF EXISTS public_read_restaurants ON public.restaurants;
DROP POLICY IF EXISTS auth_read_restaurants ON public.restaurants;

REVOKE SELECT ON public.restaurants FROM anon;

CREATE POLICY owner_read_restaurant ON public.restaurants
  FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);

-- Public-safe view: excludes phone, owner_id, onboarding_completed
CREATE OR REPLACE VIEW public.restaurants_public AS
  SELECT id, name, slug, description, logo_url, cover_image_url,
         currency, default_language, created_at, updated_at
  FROM public.restaurants;

GRANT SELECT ON public.restaurants_public TO anon, authenticated;