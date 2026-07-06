-- Add table_count to restaurants
ALTER TABLE public.restaurants 
  ADD COLUMN IF NOT EXISTS table_count INT NOT NULL DEFAULT 0;

-- Recreate view to include table_count
DROP VIEW IF EXISTS public.restaurants_public;

CREATE VIEW public.restaurants_public WITH (security_invoker = on) AS
  SELECT id, name, slug, description, logo_url, cover_image_url,
         cuisine_type, is_open, opening_hours, website, email, social_links,
         currency, default_language, subscription_status, created_at, updated_at,
         table_count
  FROM public.restaurants;

GRANT SELECT ON public.restaurants_public TO anon, authenticated;

-- Allow anon to read the safe columns
GRANT SELECT (id, name, slug, description, logo_url, cover_image_url,
              cuisine_type, is_open, opening_hours, website, email, social_links,
              currency, default_language, subscription_status, created_at, updated_at,
              table_count)
  ON public.restaurants TO anon;
