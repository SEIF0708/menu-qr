-- ==========================================
-- PROMOTIONS & UPSELLING MIGRATION
-- ==========================================

-- 1. Promotions Table
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  title_en TEXT,
  title_fr TEXT,
  title_ar TEXT,
  description_en TEXT,
  description_fr TEXT,
  description_ar TEXT,
  type TEXT NOT NULL CHECK (type IN ('banner', 'combo', 'happy_hour')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  metadata_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS promotions_restaurant_idx ON public.promotions(restaurant_id);
CREATE INDEX IF NOT EXISTS promotions_type_idx ON public.promotions(type);
CREATE INDEX IF NOT EXISTS promotions_active_idx ON public.promotions(is_active);

-- Enable RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Owner policies
DROP POLICY IF EXISTS "owner_manage_promotions" ON public.promotions;
CREATE POLICY "owner_manage_promotions" ON public.promotions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()));

-- Public read policy (only active ones)
DROP POLICY IF EXISTS "public_read_promotions" ON public.promotions;
CREATE POLICY "public_read_promotions" ON public.promotions FOR SELECT TO anon, authenticated
  USING (is_active = true AND (start_date IS NULL OR start_date <= now()) AND (end_date IS NULL OR end_date >= now()));

GRANT SELECT ON public.promotions TO anon, authenticated;
GRANT ALL ON public.promotions TO authenticated;


-- 2. Product Recommendations Table (Upselling)
CREATE TABLE IF NOT EXISTS public.product_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  primary_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  recommended_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(primary_product_id, recommended_product_id)
);

CREATE INDEX IF NOT EXISTS product_recommendations_primary_idx ON public.product_recommendations(primary_product_id);
CREATE INDEX IF NOT EXISTS product_recommendations_restaurant_idx ON public.product_recommendations(restaurant_id);

-- Enable RLS
ALTER TABLE public.product_recommendations ENABLE ROW LEVEL SECURITY;

-- Owner policies
DROP POLICY IF EXISTS "owner_manage_product_recommendations" ON public.product_recommendations;
CREATE POLICY "owner_manage_product_recommendations" ON public.product_recommendations FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()));

-- Public read policy
DROP POLICY IF EXISTS "public_read_product_recommendations" ON public.product_recommendations;
CREATE POLICY "public_read_product_recommendations" ON public.product_recommendations FOR SELECT TO anon, authenticated
  USING (true);

GRANT SELECT ON public.product_recommendations TO anon, authenticated;
GRANT ALL ON public.product_recommendations TO authenticated;

-- Updated at trigger for promotions
DROP TRIGGER IF EXISTS promotions_updated_at ON public.promotions;
CREATE TRIGGER promotions_updated_at BEFORE UPDATE ON public.promotions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- 3. Promotion Analytics View
CREATE OR REPLACE VIEW public.analytics_promotion_stats WITH (security_invoker = on) AS
SELECT 
  p.restaurant_id,
  p.id AS promotion_id,
  p.title_en,
  p.title_fr,
  p.title_ar,
  p.type,
  COUNT(ae.id) FILTER (WHERE ae.event_type = 'promotion_click') AS clicks
FROM public.promotions p
LEFT JOIN public.analytics_events ae ON p.id = ae.entity_id AND ae.entity_type = 'combo'
GROUP BY p.restaurant_id, p.id;

GRANT SELECT ON public.analytics_promotion_stats TO authenticated;
