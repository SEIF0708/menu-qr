
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

-- Storage policies for restaurant-assets bucket
-- Path convention: {owner_id}/{kind}/{filename}
CREATE POLICY "public_read_restaurant_assets" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'restaurant-assets');
CREATE POLICY "owner_upload_restaurant_assets" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'restaurant-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "owner_update_restaurant_assets" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'restaurant-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "owner_delete_restaurant_assets" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'restaurant-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
