-- ============ CATEGORIES ============
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories: public read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Categories: admins manage" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ ARTISTS ============
CREATE TABLE public.artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  city TEXT,
  bio TEXT,
  image_url TEXT,
  base_price NUMERIC(10,2) DEFAULT 0,
  specialties TEXT[] DEFAULT '{}',
  verified BOOLEAN NOT NULL DEFAULT false,
  rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Artists: public can view verified" ON public.artists FOR SELECT USING (verified = true OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Artists: own insert" ON public.artists FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Artists: own update" ON public.artists FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Artists: admins manage" ON public.artists FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER artists_updated_at BEFORE UPDATE ON public.artists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ SERVICES ============
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Services: public read" ON public.services FOR SELECT USING (true);
CREATE POLICY "Services: artist manages own" ON public.services FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.artists a WHERE a.id = artist_id AND a.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.artists a WHERE a.id = artist_id AND a.user_id = auth.uid()));
CREATE POLICY "Services: admins manage" ON public.services FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ AVAILABILITY SLOTS ============
CREATE TABLE public.availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_booked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_slots_artist_date ON public.availability_slots(artist_id, slot_date);
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Slots: public read" ON public.availability_slots FOR SELECT USING (true);
CREATE POLICY "Slots: artist manages own" ON public.availability_slots FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.artists a WHERE a.id = artist_id AND a.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.artists a WHERE a.id = artist_id AND a.user_id = auth.uid()));

-- ============ BOOKING STATUS ENUM ============
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'rescheduled');
CREATE TYPE public.payment_status AS ENUM ('unpaid', 'advance_paid', 'paid', 'refunded');
CREATE TYPE public.payment_method AS ENUM ('upi', 'cash', 'card', 'netbanking');

-- ============ BOOKINGS ============
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  status public.booking_status NOT NULL DEFAULT 'pending',
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_status public.payment_status NOT NULL DEFAULT 'unpaid',
  notes TEXT,
  customer_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_bookings_customer ON public.bookings(customer_id);
CREATE INDEX idx_bookings_artist ON public.bookings(artist_id);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bookings: customer views own" ON public.bookings FOR SELECT TO authenticated USING (auth.uid() = customer_id);
CREATE POLICY "Bookings: artist views own" ON public.bookings FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.artists a WHERE a.id = artist_id AND a.user_id = auth.uid()));
CREATE POLICY "Bookings: admin views all" ON public.bookings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Bookings: customer creates" ON public.bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Bookings: customer updates own" ON public.bookings FOR UPDATE TO authenticated USING (auth.uid() = customer_id) WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Bookings: artist updates own" ON public.bookings FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.artists a WHERE a.id = artist_id AND a.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.artists a WHERE a.id = artist_id AND a.user_id = auth.uid()));
CREATE POLICY "Bookings: admin manages" ON public.bookings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ REVIEWS ============
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews: public read" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Reviews: customer creates own" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Reviews: customer updates own" ON public.reviews FOR UPDATE TO authenticated USING (auth.uid() = customer_id) WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Reviews: customer deletes own" ON public.reviews FOR DELETE TO authenticated USING (auth.uid() = customer_id);

-- Trigger to keep artist rating fresh
CREATE OR REPLACE FUNCTION public.refresh_artist_rating()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE target_artist UUID;
BEGIN
  target_artist := COALESCE(NEW.artist_id, OLD.artist_id);
  UPDATE public.artists
  SET rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 2) FROM public.reviews WHERE artist_id = target_artist), 0),
      review_count = (SELECT COUNT(*) FROM public.reviews WHERE artist_id = target_artist)
  WHERE id = target_artist;
  RETURN NULL;
END;
$$;
CREATE TRIGGER reviews_refresh_rating AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.refresh_artist_rating();

-- ============ PAYMENTS ============
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  method public.payment_method NOT NULL DEFAULT 'upi',
  status public.payment_status NOT NULL DEFAULT 'unpaid',
  txn_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Payments: customer views own" ON public.payments FOR SELECT TO authenticated USING (auth.uid() = customer_id);
CREATE POLICY "Payments: artist views for own bookings" ON public.payments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.bookings b JOIN public.artists a ON a.id = b.artist_id WHERE b.id = booking_id AND a.user_id = auth.uid()));
CREATE POLICY "Payments: admin views all" ON public.payments FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Payments: customer creates own" ON public.payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Payments: admin manages" ON public.payments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, read);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Notifications: own select" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Notifications: own update" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Notifications: own delete" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Notifications: insert by self or admin" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- ============ FAVORITES ============
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (customer_id, artist_id)
);
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Favorites: own select" ON public.favorites FOR SELECT TO authenticated USING (auth.uid() = customer_id);
CREATE POLICY "Favorites: own insert" ON public.favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Favorites: own delete" ON public.favorites FOR DELETE TO authenticated USING (auth.uid() = customer_id);

-- ============ UPDATE SIGNUP TRIGGER ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  chosen_role public.app_role;
  meta_role TEXT;
BEGIN
  meta_role := NEW.raw_user_meta_data ->> 'role';
  IF meta_role = 'artist' THEN
    chosen_role := 'artist';
  ELSE
    chosen_role := 'customer';
  END IF;

  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, chosen_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Auto-create artist profile if signing up as artist
  IF chosen_role = 'artist' THEN
    INSERT INTO public.artists (user_id, name, city, bio, specialties)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
      NEW.raw_user_meta_data ->> 'city',
      NEW.raw_user_meta_data ->> 'bio',
      COALESCE(string_to_array(NEW.raw_user_meta_data ->> 'specialties', ','), '{}')
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Re-attach the trigger if it was missing
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ SEED CATEGORIES ============
INSERT INTO public.categories (name, slug, icon, description) VALUES
  ('Bridal Makeup', 'bridal-makeup', '💄', 'Premium bridal makeup for your big day'),
  ('Party Makeup', 'party-makeup', '✨', 'Glam looks for parties and events'),
  ('HD Makeup', 'hd-makeup', '🎨', 'Camera-ready high-definition makeup'),
  ('Mehndi', 'mehndi', '🌿', 'Traditional and modern mehndi designs'),
  ('Bridal Mehndi', 'bridal-mehndi', '👰', 'Intricate bridal mehndi'),
  ('Hair Styling', 'hair-styling', '💇', 'Hair styling for all occasions'),
  ('Saree Draping', 'saree-draping', '🥻', 'Professional saree draping'),
  ('Nail Art', 'nail-art', '💅', 'Creative nail art and designs')
ON CONFLICT (slug) DO NOTHING;