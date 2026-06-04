ALTER VIEW public.restaurants_public SET (security_invoker = on);

-- Allow anon to read only the safe columns of restaurants (needed for the view)
GRANT SELECT (id, name, slug, description, logo_url, cover_image_url,
              currency, default_language, created_at, updated_at)
  ON public.restaurants TO anon;

CREATE POLICY anon_read_restaurants_safe ON public.restaurants
  FOR SELECT TO anon
  USING (true);