import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, MapPin, Star, BadgeCheck, Sparkles, Heart, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BookingDialog } from "@/components/BookingDialog";
import { PortfolioGallery } from "@/components/PortfolioManager";
import { AvailabilityViewer } from "@/components/AvailabilityManager";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { formatINR, formatDate } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/artists/$artistId")({
  component: ArtistDetailPage,
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Artist not found</h1>
        <Link to="/artists" className="text-primary mt-3 inline-block">← Browse artists</Link>
      </div>
    </div>
  ),
});

type Artist = {
  id: string;
  user_id: string;
  name: string;
  city: string | null;
  bio: string | null;
  image_url: string | null;
  base_price: number | null;
  specialties: string[] | null;
  verified: boolean;
  rating: number;
  review_count: number;
};

type Service = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  duration_minutes: number;
};

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: { display_name: string | null } | null;
};

const FALLBACK = "https://images.unsplash.com/photo-1664575599618-8f6bd76fc670?w=1200&q=80";

function ArtistDetailPage() {
  const { artistId } = useParams({ from: "/artists/$artistId" });
  const { user } = useAuth();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorited, setFavorited] = useState(false);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: a } = await supabase
        .from("artists")
        .select("*")
        .eq("id", artistId)
        .maybeSingle();
      setArtist((a as Artist) ?? null);

      const [{ data: svc }, { data: rv }] = await Promise.all([
        supabase.from("services").select("id, title, description, price, duration_minutes").eq("artist_id", artistId).eq("active", true),
        supabase
          .from("reviews")
          .select("id, rating, comment, created_at, profiles!reviews_customer_id_fkey(display_name)")
          .eq("artist_id", artistId)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
      setServices((svc as Service[]) ?? []);
      setReviews((rv as unknown as Review[]) ?? []);
      setLoading(false);
    })();
  }, [artistId]);

  useEffect(() => {
    if (!user || !artist) return;
    supabase
      .from("favorites")
      .select("id")
      .eq("customer_id", user.id)
      .eq("artist_id", artist.id)
      .maybeSingle()
      .then(({ data }) => setFavorited(!!data));
  }, [user?.id, artist?.id]);

  const toggleFav = async () => {
    if (!user || !artist) return toast.error("Sign in to save artists");
    if (favorited) {
      await supabase.from("favorites").delete().eq("customer_id", user.id).eq("artist_id", artist.id);
      setFavorited(false);
    } else {
      await supabase.from("favorites").insert({ customer_id: user.id, artist_id: artist.id });
      setFavorited(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blush/20 via-background to-champagne/20">
        <Navbar />
        <div className="pt-28 max-w-5xl mx-auto px-4">
          <div className="h-72 bg-card rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blush/20 via-background to-champagne/20">
        <Navbar />
        <div className="pt-28 max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-semibold">Artist not found</h1>
          <Link to="/artists" className="text-primary mt-3 inline-block">← Browse artists</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blush/20 via-background to-champagne/20">
      <Navbar />
      <main className="pt-28 pb-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Link to="/artists" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
            <ChevronLeft className="size-4" /> All artists
          </Link>

          {/* Hero */}
          <section className="bg-card rounded-3xl shadow-card overflow-hidden mb-8">
            <div className="h-48 md:h-64 gradient-rose relative">
              <img src={artist.image_url || FALLBACK} alt="" className="w-full h-full object-cover opacity-40" />
            </div>
            <div className="px-6 md:px-8 pb-6 -mt-16 md:-mt-20 grid md:grid-cols-[auto_1fr_auto] gap-5 items-end">
              <img
                src={artist.image_url || FALLBACK}
                alt={artist.name}
                className="size-32 md:size-40 rounded-3xl ring-4 ring-card object-cover shadow-lux"
              />
              <div className="md:pb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-3xl md:text-4xl font-display font-bold italic">{artist.name}</h1>
                  {artist.verified && (
                    <Badge className="bg-primary/10 text-primary border-primary/30 gap-1">
                      <BadgeCheck className="size-3" /> Verified
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                  <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" /> {artist.city || "—"}</span>
                  <span className="inline-flex items-center gap-1">
                    <Star className="size-3.5 fill-primary text-primary" />
                    <span className="font-semibold text-foreground">{Number(artist.rating).toFixed(1)}</span>
                    <span>({artist.review_count} reviews)</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className="size-3.5 text-primary" /> from {formatINR(artist.base_price)}
                  </span>
                </div>
                <div className="flex gap-1.5 flex-wrap mt-3">
                  {(artist.specialties ?? []).map((s) => (
                    <Badge key={s} className="bg-blush/60 text-deep-rose border-0 font-normal">{s}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 md:pb-2">
                <Button variant="outline" size="icon" onClick={toggleFav} aria-label="Save">
                  <Heart className={`size-4 ${favorited ? "fill-primary text-primary" : ""}`} />
                </Button>
                <Button onClick={() => setBooking(true)} className="gradient-rose text-white border-0 shadow-glow">
                  <CalendarIcon className="size-4" /> Book now
                </Button>
              </div>
            </div>
            {artist.bio && (
              <div className="px-6 md:px-8 pb-6">
                <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">{artist.bio}</p>
              </div>
            )}
          </section>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Portfolio */}
              <section className="bg-card rounded-3xl shadow-card p-6">
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Sparkles className="size-5 text-primary" /> Portfolio
                </h2>
                <PortfolioGallery artistId={artist.id} />
              </section>

              {/* Services */}
              <section className="bg-card rounded-3xl shadow-card p-6">
                <h2 className="font-semibold text-lg mb-4">Services</h2>
                {services.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No services listed yet.</div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {services.map((s) => (
                      <div key={s.id} className="rounded-2xl border p-4 hover:bg-blush/30 transition">
                        <div className="font-semibold">{s.title}</div>
                        {s.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description}</p>}
                        <div className="mt-3 flex items-center justify-between">
                          <div className="text-xs text-muted-foreground">{s.duration_minutes} min</div>
                          <div className="font-bold text-primary">{formatINR(s.price)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Reviews */}
              <section className="bg-card rounded-3xl shadow-card p-6">
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Star className="size-5 text-primary" /> Reviews ({reviews.length})
                </h2>
                {reviews.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No reviews yet.</div>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((r) => (
                      <div key={r.id} className="p-4 rounded-2xl bg-blush/30">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-sm">{r.profiles?.display_name ?? "Customer"}</div>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`size-3.5 ${i < r.rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
                            ))}
                          </div>
                        </div>
                        {r.comment && <p className="text-sm mt-2 text-muted-foreground">"{r.comment}"</p>}
                        <div className="text-[10px] text-muted-foreground mt-1">{formatDate(r.created_at)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <aside className="space-y-6">
              <section className="bg-card rounded-3xl shadow-card p-6 sticky top-24">
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <CalendarIcon className="size-5 text-primary" /> Open slots
                </h2>
                <AvailabilityViewer artistId={artist.id} />
                <Button onClick={() => setBooking(true)} className="w-full mt-5 gradient-rose text-white border-0 shadow-glow">
                  Book {artist.name.split(" ")[0]}
                </Button>
              </section>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
      <BookingDialog open={booking} onOpenChange={setBooking} artist={artist} />
    </div>
  );
}
