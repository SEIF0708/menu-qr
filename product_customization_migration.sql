-- Product Customizations Migration

-- Product Sizes (Variations)
CREATE TABLE IF NOT EXISTS public.product_sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name_ar TEXT,
  name_fr TEXT,
  name_en TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_sizes_product_idx ON public.product_sizes(product_id);

GRANT SELECT ON public.product_sizes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_sizes TO authenticated;
GRANT ALL ON public.product_sizes TO service_role;

ALTER TABLE public.product_sizes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_product_sizes" ON public.product_sizes;
CREATE POLICY "public_read_product_sizes" ON public.product_sizes FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "auth_read_product_sizes" ON public.product_sizes;
CREATE POLICY "auth_read_product_sizes" ON public.product_sizes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "owner_manage_product_sizes" ON public.product_sizes;
CREATE POLICY "owner_manage_product_sizes" ON public.product_sizes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.products p JOIN public.restaurants r ON p.restaurant_id = r.id WHERE p.id = product_id AND r.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.products p JOIN public.restaurants r ON p.restaurant_id = r.id WHERE p.id = product_id AND r.owner_id = auth.uid()));


-- Modifier Groups (e.g. Choose Toppings)
CREATE TABLE IF NOT EXISTS public.modifier_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name_ar TEXT,
  name_fr TEXT,
  name_en TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT false,
  min_selections INT NOT NULL DEFAULT 0,
  max_selections INT,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS modifier_groups_product_idx ON public.modifier_groups(product_id);

GRANT SELECT ON public.modifier_groups TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.modifier_groups TO authenticated;
GRANT ALL ON public.modifier_groups TO service_role;

ALTER TABLE public.modifier_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_modifier_groups" ON public.modifier_groups;
CREATE POLICY "public_read_modifier_groups" ON public.modifier_groups FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "auth_read_modifier_groups" ON public.modifier_groups;
CREATE POLICY "auth_read_modifier_groups" ON public.modifier_groups FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "owner_manage_modifier_groups" ON public.modifier_groups;
CREATE POLICY "owner_manage_modifier_groups" ON public.modifier_groups FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.products p JOIN public.restaurants r ON p.restaurant_id = r.id WHERE p.id = product_id AND r.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.products p JOIN public.restaurants r ON p.restaurant_id = r.id WHERE p.id = product_id AND r.owner_id = auth.uid()));


-- Modifiers (e.g. Extra Cheese)
CREATE TABLE IF NOT EXISTS public.modifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.modifier_groups(id) ON DELETE CASCADE,
  name_ar TEXT,
  name_fr TEXT,
  name_en TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS modifiers_group_idx ON public.modifiers(group_id);

GRANT SELECT ON public.modifiers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.modifiers TO authenticated;
GRANT ALL ON public.modifiers TO service_role;

ALTER TABLE public.modifiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_modifiers" ON public.modifiers;
CREATE POLICY "public_read_modifiers" ON public.modifiers FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "auth_read_modifiers" ON public.modifiers;
CREATE POLICY "auth_read_modifiers" ON public.modifiers FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "owner_manage_modifiers" ON public.modifiers;
CREATE POLICY "owner_manage_modifiers" ON public.modifiers FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.modifier_groups mg 
    JOIN public.products p ON mg.product_id = p.id 
    JOIN public.restaurants r ON p.restaurant_id = r.id 
    WHERE mg.id = group_id AND r.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.modifier_groups mg 
    JOIN public.products p ON mg.product_id = p.id 
    JOIN public.restaurants r ON p.restaurant_id = r.id 
    WHERE mg.id = group_id AND r.owner_id = auth.uid()
  ));


-- Product Cross Sells (Usually Taken With)
CREATE TABLE IF NOT EXISTS public.product_cross_sells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  cross_sell_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, cross_sell_product_id)
);

CREATE INDEX IF NOT EXISTS product_cross_sells_product_idx ON public.product_cross_sells(product_id);

GRANT SELECT ON public.product_cross_sells TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_cross_sells TO authenticated;
GRANT ALL ON public.product_cross_sells TO service_role;

ALTER TABLE public.product_cross_sells ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_product_cross_sells" ON public.product_cross_sells;
CREATE POLICY "public_read_product_cross_sells" ON public.product_cross_sells FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "auth_read_product_cross_sells" ON public.product_cross_sells;
CREATE POLICY "auth_read_product_cross_sells" ON public.product_cross_sells FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "owner_manage_product_cross_sells" ON public.product_cross_sells;
CREATE POLICY "owner_manage_product_cross_sells" ON public.product_cross_sells FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.products p JOIN public.restaurants r ON p.restaurant_id = r.id WHERE p.id = product_id AND r.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.products p JOIN public.restaurants r ON p.restaurant_id = r.id WHERE p.id = product_id AND r.owner_id = auth.uid()));

-- Update the Products table to have boolean flags for easier UI rendering
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS has_sizes BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_modifiers BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_cross_sells BOOLEAN NOT NULL DEFAULT false;
