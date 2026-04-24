import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Calendar, DollarSign, Star, Users, Plus, Check, X, Pencil, Trash2, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { formatINR, formatDate, statusColor } from "@/lib/format";
import { NotificationsBell } from "@/components/NotificationsBell";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/artist")({
  component: ArtistDash,
});

type ArtistRow = {
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
type ServiceRow = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  category_id: string | null;
  active: boolean;
};
type BookingRow = {
  id: string;
  customer_id: string;
  service_id: string | null;
  booking_date: string;
  booking_time: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "rescheduled";
  amount: number;
  customer_address: string | null;
  services: { title: string } | null;
  profiles: { display_name: string | null; email: string | null } | null;
};
type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: { display_name: string | null } | null;
};
type Category = { id: string; name: string };

function StatCard({ icon: Icon, label, value, change }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; change?: string }) {
  return (
    <div className="glass rounded-2xl p-5 hover-lift">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
          <div className="text-3xl font-bold mt-2">{value}</div>
          {change && <div className="text-xs text-primary mt-1">{change}</div>}
        </div>
        <div className="size-11 rounded-xl gradient-rose grid place-items-center shadow-glow">
          <Icon className="size-5 text-white" />
        </div>
      </div>
    </div>
  );
}

function ArtistDash() {
  const { user } = useAuth();
  const [artist, setArtist] = useState<ArtistRow | null>(null);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingService, setEditingService] = useState<ServiceRow | "new" | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const { data: a } = await supabase.from("artists").select("*").eq("user_id", user.id).maybeSingle();
    if (!a) return;
    setArtist(a as ArtistRow);

    const [{ data: svc }, { data: bk }, { data: rv }, { data: cats }] = await Promise.all([
      supabase.from("services").select("*").eq("artist_id", a.id).order("created_at", { ascending: false }),
      supabase.from("bookings").select("id, customer_id, service_id, booking_date, booking_time, status, amount, customer_address, services(title), profiles!bookings_customer_id_fkey(display_name, email)").eq("artist_id", a.id).order("booking_date", { ascending: false }),
      supabase.from("reviews").select("id, rating, comment, created_at, profiles!reviews_customer_id_fkey(display_name)").eq("artist_id", a.id).order("created_at", { ascending: false }),
      supabase.from("categories").select("id, name").order("name"),
    ]);
    setServices((svc as ServiceRow[]) ?? []);
    // Note: bookings join to profiles may fail if FK alias not defined; fall back to plain select
    if (bk) setBookings(bk as unknown as BookingRow[]);
    else {
      const { data: bk2 } = await supabase.from("bookings").select("id, customer_id, service_id, booking_date, booking_time, status, amount, customer_address, services(title)").eq("artist_id", a.id).order("booking_date", { ascending: false });
      setBookings((bk2 ?? []).map((b) => ({ ...b, profiles: null })) as unknown as BookingRow[]);
    }
    if (rv) setReviews(rv as unknown as ReviewRow[]);
    setCategories((cats as Category[]) ?? []);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Realtime: refresh when new booking comes in
  useEffect(() => {
    if (!artist) return;
    const ch = supabase
      .channel(`artist-bookings:${artist.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: `artist_id=eq.${artist.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [artist?.id, load]);

  const updateBookingStatus = async (id: string, status: BookingRow["status"]) => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    // Notify customer
    const b = bookings.find((x) => x.id === id);
    if (b) {
      await supabase.from("notifications").insert({
        user_id: b.customer_id,
        type: `booking_${status}`,
        title: status === "confirmed" ? "Booking confirmed!" : status === "cancelled" ? "Booking declined" : `Booking ${status}`,
        body: `${artist?.name} ${status === "confirmed" ? "accepted" : status === "cancelled" ? "declined" : "updated"} your booking on ${formatDate(b.booking_date)}.`,
        link: "/dashboard/customer",
      });
    }
    toast.success(`Booking ${status}`);
    load();
  };

  const saveService = async (form: Omit<ServiceRow, "id" | "active"> & { id?: string }) => {
    if (!artist) return;
    if (form.id) {
      const { error } = await supabase.from("services").update({
        title: form.title, description: form.description, price: form.price,
        duration_minutes: form.duration_minutes, category_id: form.category_id,
      }).eq("id", form.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("services").insert({
        artist_id: artist.id, title: form.title, description: form.description ?? null,
        price: form.price, duration_minutes: form.duration_minutes, category_id: form.category_id,
      });
      if (error) return toast.error(error.message);
    }
    toast.success("Service saved");
    setEditingService(null);
    load();
  };

  const deleteService = async (id: string) => {
    if (!confirm("Delete this service?")) return;
    await supabase.from("services").delete().eq("id", id);
    load();
  };

  const saveProfile = async (form: Partial<ArtistRow>) => {
    if (!artist) return;
    const { error } = await supabase.from("artists").update(form).eq("id", artist.id);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    setEditingProfile(false);
    load();
  };

  if (!artist) {
    return (
      <div className="glass rounded-3xl p-10 text-center">
        <h2 className="text-xl font-semibold">Artist profile not ready</h2>
        <p className="text-sm text-muted-foreground mt-2">Sign up via the artist signup page to create your profile.</p>
      </div>
    );
  }

  const upcoming = bookings.filter((b) => ["pending", "confirmed", "rescheduled"].includes(b.status));
  const completed = bookings.filter((b) => b.status === "completed");
  const earnings = completed.reduce((s, b) => s + Number(b.amount), 0);
  const monthEarnings = completed
    .filter((b) => new Date(b.booking_date).getMonth() === new Date().getMonth())
    .reduce((s, b) => s + Number(b.amount), 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold italic">Welcome back, {artist.name.split(" ")[0]} ✨</h1>
          <p className="text-muted-foreground">Here's what's happening with your bookings.</p>
        </div>
        <div className="flex items-center gap-3">
          <NotificationsBell />
          <Button onClick={() => setEditingService("new")} className="gradient-rose text-white border-0 shadow-glow">
            <Plus className="size-4" /> Add Service
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Calendar} label="Bookings" value={String(bookings.length)} change={`${upcoming.length} upcoming`} />
        <StatCard icon={DollarSign} label="Earnings" value={formatINR(earnings)} change={`${formatINR(monthEarnings)} this month`} />
        <StatCard icon={Star} label="Rating" value={Number(artist.rating).toFixed(1)} change={`${artist.review_count} reviews`} />
        <StatCard icon={Users} label="Completed" value={String(completed.length)} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile */}
        <div className="lg:col-span-1 bg-card rounded-3xl shadow-card overflow-hidden">
          <div className="h-32 gradient-rose" />
          <div className="px-6 pb-6 -mt-12">
            <img src={artist.image_url || "https://images.unsplash.com/photo-1664575599618-8f6bd76fc670?w=400&q=80"} alt="" className="size-24 rounded-2xl ring-4 ring-card object-cover shadow-lux" />
            <div className="flex items-center gap-2 mt-3">
              <h3 className="font-semibold text-lg">{artist.name}</h3>
              {artist.verified && <BadgeCheck className="size-4 text-primary" />}
            </div>
            <div className="text-sm text-muted-foreground">{artist.city || "Add your city"}</div>
            {artist.bio && <p className="text-sm mt-2 text-muted-foreground line-clamp-3">{artist.bio}</p>}
            <div className="flex gap-1.5 flex-wrap mt-3">
              {(artist.specialties ?? []).map((s) => (
                <Badge key={s} className="bg-blush/60 text-deep-rose border-0">{s}</Badge>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4" onClick={() => setEditingProfile(true)}><Pencil className="size-3" /> Edit Profile</Button>
            {!artist.verified && (
              <p className="text-[11px] text-amber-600 text-center mt-3">Awaiting admin verification — your profile isn't public yet.</p>
            )}
          </div>
        </div>

        {/* Bookings */}
        <div className="lg:col-span-2 bg-card rounded-3xl shadow-card p-6" id="bookings">
          <h3 className="font-semibold text-lg mb-4">Booking Requests</h3>
          {bookings.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-10">No bookings yet — set up your services and slots.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground tracking-wider">
                  <tr className="border-b">
                    <th className="text-left py-3">Customer</th>
                    <th className="text-left py-3">Service</th>
                    <th className="text-left py-3">When</th>
                    <th className="text-left py-3">Status</th>
                    <th className="text-right py-3">Amount</th>
                    <th className="text-right py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id} className="border-b last:border-0 hover:bg-blush/30 transition">
                      <td className="py-3 font-medium">{b.profiles?.display_name ?? b.customer_id.slice(0, 8)}</td>
                      <td className="py-3 text-muted-foreground">{b.services?.title ?? "Custom"}</td>
                      <td className="py-3 text-muted-foreground">{formatDate(b.booking_date)} · {b.booking_time.slice(0, 5)}</td>
                      <td className="py-3"><Badge variant="outline" className={statusColor(b.status)}>{b.status}</Badge></td>
                      <td className="py-3 text-right font-semibold">{formatINR(b.amount)}</td>
                      <td className="py-3 text-right">
                        <div className="inline-flex gap-1.5">
                          {b.status === "pending" && (
                            <>
                              <Button size="sm" className="h-7 gradient-rose text-white border-0" onClick={() => updateBookingStatus(b.id, "confirmed")}><Check className="size-3" /></Button>
                              <Button size="sm" variant="outline" className="h-7 text-destructive" onClick={() => updateBookingStatus(b.id, "cancelled")}><X className="size-3" /></Button>
                            </>
                          )}
                          {b.status === "confirmed" && (
                            <Button size="sm" variant="outline" className="h-7" onClick={() => updateBookingStatus(b.id, "completed")}>Mark done</Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Services */}
      <div className="bg-card rounded-3xl shadow-card p-6">
        <div className="flex justify-between mb-4">
          <h3 className="font-semibold text-lg">Your Services</h3>
          <Button size="sm" variant="outline" onClick={() => setEditingService("new")}><Plus className="size-3" /> Add</Button>
        </div>
        {services.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">No services yet — add your first one.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {services.map((s) => (
              <div key={s.id} className="rounded-2xl border p-4 hover:bg-blush/30 transition">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold">{s.title}</div>
                  <div className="flex gap-1">
                    <button onClick={() => setEditingService(s)} className="text-muted-foreground hover:text-primary"><Pencil className="size-3.5" /></button>
                    <button onClick={() => deleteService(s.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5" /></button>
                  </div>
                </div>
                {s.description && <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description}</div>}
                <div className="flex justify-between items-end mt-3">
                  <div className="text-xs text-muted-foreground">{s.duration_minutes} min</div>
                  <div className="font-bold text-primary">{formatINR(s.price)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reviews */}
      <div className="bg-card rounded-3xl shadow-card p-6">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><Star className="size-5 text-primary" /> Reviews ({reviews.length})</h3>
        {reviews.length === 0 ? (
          <div className="text-sm text-muted-foreground">No reviews yet. They'll appear here once customers rate you.</div>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="p-4 rounded-2xl bg-blush/30">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm">{r.profiles?.display_name ?? "Customer"}</div>
                  <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} className={`size-3.5 ${i < r.rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />)}</div>
                </div>
                {r.comment && <p className="text-sm mt-2 text-muted-foreground">"{r.comment}"</p>}
                <div className="text-[10px] text-muted-foreground mt-1">{formatDate(r.created_at)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit profile dialog */}
      <Dialog open={editingProfile} onOpenChange={setEditingProfile}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-display italic">Edit profile</DialogTitle></DialogHeader>
          <ProfileForm initial={artist} onSave={saveProfile} />
        </DialogContent>
      </Dialog>

      {/* Service dialog */}
      <Dialog open={!!editingService} onOpenChange={(v) => !v && setEditingService(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display italic">{editingService === "new" ? "Add service" : "Edit service"}</DialogTitle>
            <DialogDescription>Customers will see and book this service.</DialogDescription>
          </DialogHeader>
          {editingService && (
            <ServiceForm
              initial={editingService === "new" ? null : editingService}
              categories={categories}
              onSave={saveService}
              onCancel={() => setEditingService(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProfileForm({ initial, onSave }: { initial: ArtistRow; onSave: (f: Partial<ArtistRow>) => void }) {
  const [name, setName] = useState(initial.name);
  const [city, setCity] = useState(initial.city ?? "");
  const [bio, setBio] = useState(initial.bio ?? "");
  const [imageUrl, setImageUrl] = useState(initial.image_url ?? "");
  const [basePrice, setBasePrice] = useState(String(initial.base_price ?? 0));
  const [specialties, setSpecialties] = useState((initial.specialties ?? []).join(", "));
  return (
    <div className="grid gap-3">
      <div><Label className="text-xs">Display name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div><Label className="text-xs">City</Label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div>
      <div><Label className="text-xs">Cover photo URL</Label><Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" /></div>
      <div><Label className="text-xs">Base price (₹)</Label><Input type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} /></div>
      <div><Label className="text-xs">Specialties (comma separated)</Label><Input value={specialties} onChange={(e) => setSpecialties(e.target.value)} /></div>
      <div><Label className="text-xs">Bio</Label><Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} /></div>
      <DialogFooter>
        <Button onClick={() => onSave({
          name, city: city || null, bio: bio || null, image_url: imageUrl || null,
          base_price: Number(basePrice) || 0,
          specialties: specialties.split(",").map((s) => s.trim()).filter(Boolean),
        })} className="gradient-rose text-white border-0">Save</Button>
      </DialogFooter>
    </div>
  );
}

function ServiceForm({ initial, categories, onSave, onCancel }: { initial: ServiceRow | null; categories: Category[]; onSave: (f: { id?: string; title: string; description: string | null; price: number; duration_minutes: number; category_id: string | null }) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(String(initial?.price ?? 0));
  const [duration, setDuration] = useState(String(initial?.duration_minutes ?? 60));
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? "");
  return (
    <div className="grid gap-3">
      <div><Label className="text-xs">Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
      <div><Label className="text-xs">Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">Price (₹)</Label><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
        <div><Label className="text-xs">Duration (min)</Label><Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} /></div>
      </div>
      <div>
        <Label className="text-xs">Category</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger><SelectValue placeholder="Choose category" /></SelectTrigger>
          <SelectContent>
            {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => {
          if (!title.trim()) return toast.error("Title required");
          onSave({
            id: initial?.id, title, description: description || null,
            price: Number(price) || 0, duration_minutes: Number(duration) || 60,
            category_id: categoryId || null,
          });
        }} className="gradient-rose text-white border-0">Save service</Button>
      </DialogFooter>
    </div>
  );
}
