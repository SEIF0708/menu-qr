-- Waiter Authentication and Profiles
CREATE TABLE IF NOT EXISTS public.waiters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pin_code TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS waiters_restaurant_idx ON public.waiters(restaurant_id);

ALTER TABLE public.waiters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_manage_waiters" ON public.waiters;
CREATE POLICY "owner_manage_waiters" ON public.waiters FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()));

DROP POLICY IF EXISTS "anon_read_waiters" ON public.waiters;
CREATE POLICY "anon_read_waiters" ON public.waiters FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "auth_read_waiters" ON public.waiters;
CREATE POLICY "auth_read_waiters" ON public.waiters FOR SELECT TO authenticated USING (true);


-- Client Messages (Call Waiter, Request Bill)
CREATE TABLE IF NOT EXISTS public.client_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  table_id UUID REFERENCES public.restaurant_tables(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL, -- 'call_waiter', 'request_bill', 'custom'
  content TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'acknowledged', 'resolved'
  claimed_by_waiter_id UUID REFERENCES public.waiters(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS client_messages_restaurant_idx ON public.client_messages(restaurant_id);

ALTER TABLE public.client_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a message
DROP POLICY IF EXISTS "anyone_insert_client_messages" ON public.client_messages;
CREATE POLICY "anyone_insert_client_messages" ON public.client_messages FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Anyone can read (so waiters using anon session can read)
DROP POLICY IF EXISTS "anyone_read_client_messages" ON public.client_messages;
CREATE POLICY "anyone_read_client_messages" ON public.client_messages FOR SELECT TO anon, authenticated USING (true);

-- Anyone can update (so waiters can acknowledge them)
DROP POLICY IF EXISTS "anyone_update_client_messages" ON public.client_messages;
CREATE POLICY "anyone_update_client_messages" ON public.client_messages FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Update Orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS claimed_by_waiter_id UUID REFERENCES public.waiters(id) ON DELETE SET NULL;

-- Make sure orders can be updated by anon/waiters
DROP POLICY IF EXISTS "anyone_update_orders" ON public.orders;
CREATE POLICY "anyone_update_orders" ON public.orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Realtime requires replication on tables we want to listen to
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_messages;
