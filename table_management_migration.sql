-- Table Management System Migration

-- 1. Create the restaurant_tables table
CREATE TABLE public.restaurant_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  table_number INT NOT NULL,
  qr_identifier TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create indexes for performance
CREATE INDEX restaurant_tables_restaurant_idx ON public.restaurant_tables(restaurant_id);
CREATE INDEX restaurant_tables_qr_identifier_idx ON public.restaurant_tables(qr_identifier);

-- 3. Grant permissions
GRANT SELECT ON public.restaurant_tables TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurant_tables TO authenticated;
GRANT ALL ON public.restaurant_tables TO service_role;

-- 4. Enable Row Level Security
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies
-- Anyone can view active tables if they need to scan a menu (anon & authenticated)
CREATE POLICY "public_read_tables" ON public.restaurant_tables FOR SELECT TO anon USING (true);
CREATE POLICY "auth_read_tables" ON public.restaurant_tables FOR SELECT TO authenticated USING (true);

-- Restaurant owners can manage their own tables
CREATE POLICY "owner_manage_tables" ON public.restaurant_tables FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()));

-- 6. Add trigger for updated_at
CREATE TRIGGER restaurant_tables_updated_at 
  BEFORE UPDATE ON public.restaurant_tables
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
