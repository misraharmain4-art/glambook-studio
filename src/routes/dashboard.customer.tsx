import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Calendar, Heart, Star, MapPin, X, RefreshCcw, Sparkles, FileText, BellRing, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { formatDate, formatINR, statusColor } from "@/lib/format";
import { ReviewDialog } from "@/components/ReviewDialog";
import { NotificationsBell } from "@/components/NotificationsBell";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/customer")({
  component: ClientDash,
});

type Booking = {
  id: string;
  artist_id: string;
  service_id: string | null;
  booking_date: string;
  booking_time: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "rescheduled";
  payment_status: string;
  amount: number;
  customer_address: string | null;
  notes: string | null;
  created_at: string;
  artists: { name: string; image_url: string | null; city: string | null } | null;
  services: { title: string } | null;
  reviews: { id: string }[];
};

type FavArtist = {
  id: string;
  artist_id: string;
  artists: { id: string; name: string; image_url: string | null; city: string | null; rating: number; base_price: number | null } | null;
};

const FALLBACK = "https://images.unsplash.com/photo-1664575599618-8f6bd76fc670?w=400&q=80";

function ClientDash() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [favs, setFavs] = useState<FavArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [reschedule, setReschedule] = useState<Booking | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [reviewing, setReviewing] = useState<{ bookingId: string; artistId: string; name: string } | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: bk }, { data: fv }] = await Promise.all([
      supabase
        .from("bookings")
        .select("id, artist_id, service_id, booking_date, booking_time, status, payment_status, amount, customer_address, notes, created_at, artists(name, image_url, city), services(title), reviews(id)")
        .eq("customer_id", user.id)
        .order("booking_date", { ascending: false }),
      supabase
        .from("favorites")
        .select("id, artist_id, artists(id, name, image_url, city, rating, base_price)")
        .eq("customer_id", user.id),
    ]);
    setBookings((bk as unknown as Booking[]) ?? []);
    setFavs((fv as unknown as FavArtist[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const cancel = async (id: string) => {
    if (!confirm("Cancel this booking?")) return;
    const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Booking cancelled");
    load();
  };

  const submitReschedule = async () => {
    if (!reschedule || !newDate || !newTime) return;
    const { error } = await supabase
      .from("bookings")
      .update({ booking_date: newDate, booking_time: newTime, status: "rescheduled" })
      .eq("id", reschedule.id);
    if (error) return toast.error(error.message);
    toast.success("Rescheduled ✨");
    setReschedule(null);
    setNewDate("");
    setNewTime("");
    load();
  };

  const removeFav = async (favId: string) => {
    await supabase.from("favorites").delete().eq("id", favId);
    load();
  };

  const upcoming = bookings.filter((b) => ["pending", "confirmed", "rescheduled"].includes(b.status));
  const past = bookings.filter((b) => ["completed", "cancelled"].includes(b.status));
  const totalSpent = bookings.filter((b) => b.payment_status === "paid").reduce((s, b) => s + Number(b.amount), 0);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold italic">Hello, {user?.user_metadata?.display_name?.split(" ")[0] ?? "there"} 💕</h1>
          <p className="text-muted-foreground">Your beauty plans at a glance.</p>
        </div>
        <div className="flex items-center gap-3">
          <NotificationsBell />
          <Link to="/artists">
            <Button className="gradient-rose text-white border-0 shadow-glow"><Sparkles className="size-4" /> Find an artist</Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Upcoming</div>
          <div className="text-3xl font-bold mt-2">{upcoming.length}</div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Past bookings</div>
          <div className="text-3xl font-bold mt-2">{past.length}</div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Total spent</div>
          <div className="text-3xl font-bold mt-2">{formatINR(totalSpent)}</div>
        </div>
      </div>

      {/* Upcoming */}
      <div>
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Calendar className="size-5 text-primary" /> Upcoming Appointments
        </h3>
        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">{[...Array(2)].map((_, i) => <div key={i} className="bg-card rounded-2xl h-32 animate-pulse" />)}</div>
        ) : upcoming.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-muted-foreground">
            <BellRing className="size-8 mx-auto text-primary mb-2" />
            No upcoming appointments. <Link to="/artists" className="text-primary underline">Browse artists</Link>.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {upcoming.map((b) => (
              <div key={b.id} className="glass rounded-2xl p-5 flex gap-4 hover-lift">
                <img src={b.artists?.image_url || FALLBACK} alt="" className="size-20 rounded-2xl object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold truncate">{b.artists?.name}</div>
                    <Badge variant="outline" className={statusColor(b.status)}>{b.status}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground truncate">{b.services?.title ?? "Custom service"}</div>
                  <div className="text-xs mt-2 flex items-center gap-2 text-primary">
                    <Calendar className="size-3" /> {formatDate(b.booking_date)} · {b.booking_time.slice(0, 5)}
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <Link to="/messages/$bookingId" params={{ bookingId: b.id }}>
                      <Button size="sm" variant="outline"><MessageCircle className="size-3" /> Chat</Button>
                    </Link>
                    <Button size="sm" variant="outline" onClick={() => { setReschedule(b); setNewDate(b.booking_date); setNewTime(b.booking_time.slice(0, 5)); }}>
                      <RefreshCcw className="size-3" /> Reschedule
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive" onClick={() => cancel(b.id)}>
                      <X className="size-3" /> Cancel
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History */}
      <div>
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <FileText className="size-5 text-primary" /> Booking History
        </h3>
        <div className="bg-card rounded-3xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground tracking-wider">
                <tr className="border-b">
                  <th className="text-left p-4">Artist</th>
                  <th className="text-left p-4">Service</th>
                  <th className="text-left p-4">Date</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-right p-4">Amount</th>
                  <th className="text-right p-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 && !loading && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No bookings yet.</td></tr>
                )}
                {bookings.map((b) => (
                  <tr key={b.id} className="border-b last:border-0 hover:bg-blush/30 transition">
                    <td className="p-4 font-medium">{b.artists?.name}</td>
                    <td className="p-4 text-muted-foreground">{b.services?.title ?? "—"}</td>
                    <td className="p-4 text-muted-foreground">{formatDate(b.booking_date)}</td>
                    <td className="p-4"><Badge variant="outline" className={statusColor(b.status)}>{b.status}</Badge></td>
                    <td className="p-4 text-right font-semibold">{formatINR(b.amount)}</td>
                    <td className="p-4 text-right">
                      <div className="inline-flex gap-2">
                        <Link to="/invoice/$bookingId" params={{ bookingId: b.id }}>
                          <Button size="sm" variant="ghost" className="text-xs h-7">Invoice</Button>
                        </Link>
                        {b.status === "completed" && b.reviews.length === 0 && (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setReviewing({ bookingId: b.id, artistId: b.artist_id, name: b.artists?.name ?? "" })}>
                            <Star className="size-3" /> Review
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Saved */}
      <div id="saved">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Heart className="size-5 text-primary" /> Saved Artists
        </h3>
        {favs.length === 0 ? (
          <div className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">No saved artists yet. Heart artists to save them.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {favs.map((f) => f.artists && (
              <div key={f.id} className="bg-card rounded-2xl overflow-hidden shadow-card hover-lift relative">
                <button onClick={() => removeFav(f.id)} className="absolute top-2 right-2 z-10 size-8 grid place-items-center rounded-full glass">
                  <Heart className="size-4 fill-primary text-primary" />
                </button>
                <img src={f.artists.image_url || FALLBACK} alt="" className="h-40 w-full object-cover" />
                <div className="p-4">
                  <div className="font-semibold">{f.artists.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="size-3" /> {f.artists.city ?? "—"}</div>
                  <div className="text-xs flex items-center gap-1 mt-1"><Star className="size-3 fill-primary text-primary" /> {Number(f.artists.rating).toFixed(1)}</div>
                  <div className="text-sm font-bold mt-2">{formatINR(f.artists.base_price)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reschedule dialog */}
      <Dialog open={!!reschedule} onOpenChange={(v) => !v && setReschedule(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display italic">Reschedule appointment</DialogTitle>
            <DialogDescription>Pick a new date and time.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label className="text-xs">Date</Label>
              <Input type="date" value={newDate} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setNewDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Time</Label>
              <Input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReschedule(null)}>Cancel</Button>
            <Button onClick={submitReschedule} className="gradient-rose text-white border-0">Reschedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review dialog */}
      {reviewing && (
        <ReviewDialog
          open={!!reviewing}
          onOpenChange={(v) => !v && setReviewing(null)}
          bookingId={reviewing.bookingId}
          artistId={reviewing.artistId}
          artistName={reviewing.name}
          onSubmitted={load}
        />
      )}
    </div>
  );
}
