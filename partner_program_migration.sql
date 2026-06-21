-- 1. Add user_id to referral_codes so users can own their codes
ALTER TABLE public.referral_codes
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Update the RLS policy so users can insert their own code
DROP POLICY IF EXISTS "anyone_read_referral_codes" ON public.referral_codes;
CREATE POLICY "anyone_read_referral_codes" ON public.referral_codes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "users_insert_own_referral_code" ON public.referral_codes;
CREATE POLICY "users_insert_own_referral_code" ON public.referral_codes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 3. Ensure referral_payouts exists and has the correct policies
CREATE TABLE IF NOT EXISTS public.referral_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id UUID NOT NULL REFERENCES public.referral_codes(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);

ALTER TABLE public.referral_payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_payouts" ON public.referral_payouts;
CREATE POLICY "admin_all_payouts" ON public.referral_payouts FOR ALL TO authenticated USING (true);
