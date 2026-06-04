
DROP POLICY IF EXISTS "anyone_insert_view" ON public.menu_views;
DROP POLICY IF EXISTS "auth_insert_view" ON public.menu_views;
CREATE POLICY "anyone_insert_view" ON public.menu_views FOR INSERT TO anon
  WITH CHECK (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id));
CREATE POLICY "auth_insert_view" ON public.menu_views FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id));
