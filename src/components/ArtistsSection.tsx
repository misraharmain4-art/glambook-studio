import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Star, MapPin, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { artists, cities } from "@/data/artists";
import { BookingModal } from "./BookingModal";
import type { Artist } from "@/data/artists";

export function ArtistsSection() {
  const [city, setCity] = useState("All Cities");
  const [maxPrice, setMaxPrice] = useState(10000);
  const [minRating, setMinRating] = useState(0);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Artist | null>(null);

  const filtered = useMemo(() => {
    return artists.filter(
      (a) =>
        (city === "All Cities" || a.city === city) &&
        a.price <= maxPrice &&
        a.rating >= minRating &&
        (search === "" || a.name.toLowerCase().includes(search.toLowerCase()))
    );
  }, [city, maxPrice, minRating, search]);

  return (
    <section id="artists" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-blush/40">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <span className="text-sm uppercase tracking-[0.2em] text-primary font-semibold">Featured Artists</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-3">Top-rated talent near you</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              placeholder="Search artist..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 rounded-full bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="px-4 py-2 rounded-full bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {cities.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select
              value={maxPrice}
              onChange={(e) => setMaxPrice(+e.target.value)}
              className="px-4 py-2 rounded-full bg-white border border-border text-sm"
            >
              <option value={10000}>Any price</option>
              <option value={2000}>Under ₹2,000</option>
              <option value={5000}>Under ₹5,000</option>
            </select>
            <select
              value={minRating}
              onChange={(e) => setMinRating(+e.target.value)}
              className="px-4 py-2 rounded-full bg-white border border-border text-sm"
            >
              <option value={0}>All ratings</option>
              <option value={4.5}>4.5+ ★</option>
              <option value={4.8}>4.8+ ★</option>
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="bg-card rounded-3xl overflow-hidden shadow-card hover-lift group"
            >
              <div className="relative h-64 overflow-hidden">
                <img
                  src={a.image}
                  alt={a.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-3 left-3 glass px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                  <Star className="size-3 fill-primary text-primary" />
                  {a.rating}
                </div>
                {a.verified && (
                  <div className="absolute top-3 right-3 size-7 rounded-full gradient-rose grid place-items-center shadow-glow">
                    <BadgeCheck className="size-4 text-white" />
                  </div>
                )}
                <div className="absolute bottom-3 left-3 glass px-2.5 py-1 rounded-full text-xs">
                  Starting ₹{a.price.toLocaleString()}
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-lg">{a.name}</h3>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                  <MapPin className="size-3" /> {a.city} · {a.reviews} reviews
                </div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {a.specialties.map((s) => (
                    <Badge key={s} variant="secondary" className="text-[10px] bg-blush/60 text-deep-rose border-0">
                      {s}
                    </Badge>
                  ))}
                </div>
                <Button
                  onClick={() => setSelected(a)}
                  className="w-full gradient-rose text-white border-0 shadow-soft"
                >
                  Book Now
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">No artists match your filters.</div>
        )}
      </div>

      <BookingModal artist={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
