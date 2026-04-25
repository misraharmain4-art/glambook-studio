import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, MapPin, Star, Sparkles, Filter, Heart, BadgeCheck, ChevronLeft, LayoutGrid, Map as MapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BookingDialog } from "@/components/BookingDialog";
import { ArtistsMap } from "@/components/ArtistsMap";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { formatINR } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/artists")({
  head: () => ({
    meta: [
      { title: "Find beauty artists — GlamBook" },
      { name: "description", content: "Search verified makeup, mehndi and hair artists. Filter by city, budget, rating and category." },
    ],
  }),
  component: ArtistsPage,
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
  latitude: number | null;
  longitude: number | null;
};

type Category = { id: string; name: string; slug: string };

const FALLBACK_IMG = "https://images.unsplash.com/photo-1664575599618-8f6bd76fc670?w=600&q=80";

function ArtistsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [artistCategoryMap, setArtistCategoryMap] = useState<Record<string, Set<string>>>({});
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [bookingArtist, setBookingArtist] = useState<Artist | null>(null);

  const [q, setQ] = useState("");
  const [city, setCity] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [minRating, setMinRating] = useState(0);
  const [budget, setBudget] = useState<[number, number]>([0, 20000]);
  const [sort, setSort] = useState<"recommended" | "price-asc" | "price-desc" | "rating">("recommended");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: art }, { data: cats }, { data: svc }] = await Promise.all([
        supabase
          .from("artists")
          .select("id, user_id, name, city, bio, image_url, base_price, specialties, verified, rating, review_count, latitude, longitude")
          .eq("verified", true)
          .order("rating", { ascending: false }),
        supabase.from("categories").select("id, name, slug").order("name"),
        supabase.from("services").select("artist_id, category_id").not("category_id", "is", null),
      ]);
      setArtists((art as Artist[]) ?? []);
      setCategories((cats as Category[]) ?? []);
      const map: Record<string, Set<string>> = {};
      (svc ?? []).forEach((s) => {
        if (!s.category_id) return;
        (map[s.artist_id] ??= new Set()).add(s.category_id);
      });
      setArtistCategoryMap(map);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!user) {
      setFavorites(new Set());
      return;
    }
    supabase.from("favorites").select("artist_id").eq("customer_id", user.id).then(({ data }) => {
      setFavorites(new Set((data ?? []).map((f) => f.artist_id)));
    });
  }, [user?.id]);

  const cities = useMemo(() => {
    const set = new Set(artists.map((a) => a.city).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [artists]);

  const filtered = useMemo(() => {
    let list = artists.filter((a) => {
      if (q && !a.name.toLowerCase().includes(q.toLowerCase()) && !(a.specialties ?? []).some((s) => s.toLowerCase().includes(q.toLowerCase()))) return false;
      if (city !== "all" && a.city !== city) return false;
      if (category !== "all" && !artistCategoryMap[a.id]?.has(category)) return false;
      if (a.rating < minRating) return false;
      const price = a.base_price ?? 0;
      if (price < budget[0] || price > budget[1]) return false;
      return true;
    });
    if (sort === "price-asc") list = [...list].sort((a, b) => (a.base_price ?? 0) - (b.base_price ?? 0));
    else if (sort === "price-desc") list = [...list].sort((a, b) => (b.base_price ?? 0) - (a.base_price ?? 0));
    else if (sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
    else list = [...list].sort((a, b) => (b.rating * 0.6 + b.review_count * 0.01) - (a.rating * 0.6 + a.review_count * 0.01));
    return list;
  }, [artists, q, city, category, minRating, budget, sort, artistCategoryMap]);

  const toggleFav = async (artistId: string) => {
    if (!user) {
      toast.error("Sign in to save artists");
      return;
    }
    if (favorites.has(artistId)) {
      await supabase.from("favorites").delete().eq("customer_id", user.id).eq("artist_id", artistId);
      const next = new Set(favorites);
      next.delete(artistId);
      setFavorites(next);
    } else {
      await supabase.from("favorites").insert({ customer_id: user.id, artist_id: artistId });
      setFavorites(new Set(favorites).add(artistId));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blush/20 via-background to-champagne/20">
      <Navbar />
      <main className="pt-28 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
            <ChevronLeft className="size-4" /> Back home
          </Link>
          <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-3">
                <Sparkles className="size-3.5 text-primary" />
                <span className="text-xs font-medium tracking-wider">{filtered.length} verified artists</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-display font-bold italic">Find your beauty artist</h1>
              <p className="text-muted-foreground mt-2">Filter by city, budget, rating and specialty.</p>
            </div>
          </div>

          {/* Filters */}
          <div className="glass rounded-3xl p-4 md:p-5 shadow-soft mb-8">
            <div className="grid lg:grid-cols-[1fr_180px_180px_220px_160px] gap-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/70">
                <Search className="size-4 text-primary" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search artist or specialty…" className="border-0 bg-transparent focus-visible:ring-0 px-0 h-8" />
              </div>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="bg-white/70 border-0 h-12 rounded-xl"><MapPin className="size-4 text-primary mr-1" /><SelectValue placeholder="City" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All cities</SelectItem>
                  {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={String(minRating)} onValueChange={(v) => setMinRating(Number(v))}>
                <SelectTrigger className="bg-white/70 border-0 h-12 rounded-xl"><Star className="size-4 text-primary mr-1" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Any rating</SelectItem>
                  <SelectItem value="3">3.0+</SelectItem>
                  <SelectItem value="4">4.0+</SelectItem>
                  <SelectItem value="4.5">4.5+</SelectItem>
                </SelectContent>
              </Select>
              <div className="px-3 py-2 rounded-xl bg-white/70">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Filter className="size-3" /> Budget {formatINR(budget[0])} – {formatINR(budget[1])}</div>
                <Slider value={budget} onValueChange={(v) => setBudget([v[0], v[1]] as [number, number])} min={0} max={20000} step={500} className="mt-2" />
              </div>
              <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
                <SelectTrigger className="bg-white/70 border-0 h-12 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommended">Recommended</SelectItem>
                  <SelectItem value="rating">Top rated</SelectItem>
                  <SelectItem value="price-asc">Price: low to high</SelectItem>
                  <SelectItem value="price-desc">Price: high to low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category chips */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setCategory("all")}
                className={`px-4 py-2 rounded-full text-xs font-medium transition ${
                  category === "all" ? "gradient-rose text-white shadow-glow" : "glass hover:bg-blush/40"
                }`}
              >
                All categories
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition ${
                    category === c.id ? "gradient-rose text-white shadow-glow" : "glass hover:bg-blush/40"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <div key={i} className="bg-card rounded-3xl h-80 animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass rounded-3xl p-12 text-center">
              <Sparkles className="size-10 mx-auto text-primary mb-3" />
              <h3 className="text-xl font-semibold">No artists match your filters</h3>
              <p className="text-sm text-muted-foreground mt-2">Try expanding your budget or clearing filters.</p>
            <Button className="mt-4" variant="outline" onClick={() => { setQ(""); setCity("all"); setCategory("all"); setMinRating(0); setBudget([0, 20000]); }}>Reset filters</Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((a) => (
                <article key={a.id} className="group bg-card rounded-3xl overflow-hidden shadow-card hover-lift transition">
                  <div className="relative h-56 overflow-hidden">
                    <Link to="/artists/$artistId" params={{ artistId: a.id }} className="block w-full h-full">
                      <img src={a.image_url || FALLBACK_IMG} alt={a.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                    </Link>
                    <button
                      onClick={() => toggleFav(a.id)}
                      className="absolute top-3 right-3 size-9 grid place-items-center rounded-full glass shadow-soft hover:scale-110 transition"
                      aria-label="Toggle favorite"
                    >
                      <Heart className={`size-4 ${favorites.has(a.id) ? "fill-primary text-primary" : "text-foreground/70"}`} />
                    </button>
                    {a.verified && (
                      <Badge className="absolute top-3 left-3 bg-white/90 text-primary border-0 gap-1">
                        <BadgeCheck className="size-3" /> Verified
                      </Badge>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <Link to="/artists/$artistId" params={{ artistId: a.id }} className="font-display text-lg font-semibold hover:text-primary transition">
                        {a.name}
                      </Link>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="size-3.5 fill-primary text-primary" />
                        <span className="font-semibold">{Number(a.rating).toFixed(1)}</span>
                        <span className="text-muted-foreground">({a.review_count})</span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="size-3" /> {a.city || "—"}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {(a.specialties ?? []).slice(0, 3).map((s) => (
                        <Badge key={s} className="bg-blush/60 text-deep-rose border-0 font-normal">{s}</Badge>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Starting at</div>
                        <div className="font-bold">{formatINR(a.base_price)}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" asChild size="sm">
                          <Link to="/artists/$artistId" params={{ artistId: a.id }}>View</Link>
                        </Button>
                        <Button onClick={() => setBookingArtist(a)} className="gradient-rose text-white border-0 shadow-glow">Book</Button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <BookingDialog open={!!bookingArtist} onOpenChange={(v) => !v && setBookingArtist(null)} artist={bookingArtist} />
    </div>
  );
}
