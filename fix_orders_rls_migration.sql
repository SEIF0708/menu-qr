-- Fix RLS for orders table
-- Allow anyone (anon and authenticated) to insert new orders
DROP POLICY IF EXISTS "anyone_insert_orders" ON public.orders;
CREATE POLICY "anyone_insert_orders" ON public.orders 
FOR INSERT TO anon, authenticated 
WITH CHECK (true);

-- Allow anyone to read orders (needed for order tracking)
DROP POLICY IF EXISTS "anyone_read_orders" ON public.orders;
CREATE POLICY "anyone_read_orders" ON public.orders 
FOR SELECT TO anon, authenticated 
USING (true);

-- Make sure owners can still manage everything
DROP POLICY IF EXISTS "owner_manage_orders" ON public.orders;
CREATE POLICY "owner_manage_orders" ON public.orders 
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.restaurants r 
  WHERE r.id = restaurant_id AND r.owner_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.restaurants r 
  WHERE r.id = restaurant_id AND r.owner_id = auth.uid()
));
