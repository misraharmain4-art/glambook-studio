-- 1. Storage bucket for artist media (portfolio + avatars)
INSERT INTO storage.buckets (id, name, public)
VALUES ('artist-media', 'artist-media', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage RLS policies for artist-media
CREATE POLICY "artist-media: public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'artist-media');

CREATE POLICY "artist-media: own folder insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'artist-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "artist-media: own folder update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'artist-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "artist-media: own folder delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'artist-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Portfolio table
CREATE TABLE public.artist_portfolio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_artist_portfolio_artist ON public.artist_portfolio(artist_id, sort_order);

ALTER TABLE public.artist_portfolio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Portfolio: public read"
ON public.artist_portfolio FOR SELECT
USING (true);

CREATE POLICY "Portfolio: artist manages own"
ON public.artist_portfolio FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.artists a
    WHERE a.id = artist_portfolio.artist_id
      AND a.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.artists a
    WHERE a.id = artist_portfolio.artist_id
      AND a.user_id = auth.uid()
  )
);

CREATE POLICY "Portfolio: admin manages"
ON public.artist_portfolio FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));