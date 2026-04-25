-- 1. Add geolocation to artists
ALTER TABLE public.artists
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric;

-- 2. Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_booking ON public.messages(booking_id, created_at);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Messages: participants read"
ON public.messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    LEFT JOIN public.artists a ON a.id = b.artist_id
    WHERE b.id = messages.booking_id
      AND (b.customer_id = auth.uid() OR a.user_id = auth.uid())
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Messages: participants insert"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.bookings b
    LEFT JOIN public.artists a ON a.id = b.artist_id
    WHERE b.id = messages.booking_id
      AND (b.customer_id = auth.uid() OR a.user_id = auth.uid())
  )
);

CREATE POLICY "Messages: participants update read"
ON public.messages FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    LEFT JOIN public.artists a ON a.id = b.artist_id
    WHERE b.id = messages.booking_id
      AND (b.customer_id = auth.uid() OR a.user_id = auth.uid())
  )
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 3. Promo codes
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  discount_percent integer,
  discount_flat numeric,
  min_order numeric NOT NULL DEFAULT 0,
  max_uses integer,
  uses_count integer NOT NULL DEFAULT 0,
  starts_at timestamptz,
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (discount_percent IS NOT NULL AND discount_percent BETWEEN 1 AND 100)
    OR (discount_flat IS NOT NULL AND discount_flat > 0)
  )
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Promo: authenticated read active"
ON public.promo_codes FOR SELECT TO authenticated
USING (active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Promo: admin manages"
ON public.promo_codes FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_promo_codes_updated
BEFORE UPDATE ON public.promo_codes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Promo redemptions
CREATE TABLE IF NOT EXISTS public.promo_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id uuid NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  discount_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Redemptions: own select"
ON public.promo_redemptions FOR SELECT TO authenticated
USING (auth.uid() = customer_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Redemptions: own insert"
ON public.promo_redemptions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Redemptions: admin manages"
ON public.promo_redemptions FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 5. Bookings: track applied promo
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS promo_code_id uuid REFERENCES public.promo_codes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS discount_amount numeric NOT NULL DEFAULT 0;