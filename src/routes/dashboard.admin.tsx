import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, Sparkles, Calendar, DollarSign, Trash2, Shield, UserPlus, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { artists } from "@/data/artists";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/components/AuthProvider";
import { PromoCodesManager } from "@/components/PromoCodesManager";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/admin")({
  component: AdminDash,
});

function StatCard({ icon: Icon, label, value, change }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; change: string }) {
  return (
    <div className="glass rounded-2xl p-5 hover-lift">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
          <div className="text-3xl font-bold mt-2">{value}</div>
          <div className="text-xs text-primary mt-1">{change}</div>
        </div>
        <div className="size-11 rounded-xl gradient-rose grid place-items-center shadow-glow">
          <Icon className="size-5 text-white" />
        </div>
      </div>
    </div>
  );
}

type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  roles: AppRole[];
};

function AdminDash() {
  const { role, roleLoading } = useAuth();
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ totalArtists: 0, unverified: 0, totalBookings: 0, revenue: 0 });
  const [monthly, setMonthly] = useState<{ label: string; bookings: number; revenue: number }[]>([]);
  const [pendingArtists, setPendingArtists] = useState<{ id: string; name: string; city: string | null; created_at: string }[]>([]);

  const isAdmin = role === "admin";

  const loadUsers = async () => {
    setLoadingUsers(true);
    const [{ data: rolesRows }, { data: profileRows }] = await Promise.all([
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("profiles").select("id, email, display_name, created_at"),
    ]);
    const profileMap = new Map<string, Omit<ProfileRow, "roles">>();
    (profileRows ?? []).forEach((p) => profileMap.set(p.id, p));
    const rolesMap = new Map<string, AppRole[]>();
    (rolesRows ?? []).forEach((r) => {
      const list = rolesMap.get(r.user_id) ?? [];
      list.push(r.role as AppRole);
      rolesMap.set(r.user_id, list);
    });
    const merged: ProfileRow[] = Array.from(rolesMap.keys()).map((uid) => {
      const p = profileMap.get(uid);
      return {
        id: uid,
        email: p?.email ?? null,
        display_name: p?.display_name ?? null,
        created_at: p?.created_at ?? "",
        roles: rolesMap.get(uid) ?? [],
      };
    });
    setUsers(merged);
    setLoadingUsers(false);
  };

  const loadStats = async () => {
    const [{ data: artistsAll }, { data: bookingsAll }, { data: paymentsAll }] = await Promise.all([
      supabase.from("artists").select("id, name, city, verified, created_at").order("created_at", { ascending: false }),
      supabase.from("bookings").select("id, booking_date, amount, status, payment_status").order("booking_date", { ascending: false }),
      supabase.from("payments").select("amount, status"),
    ]);
    const totalArtists = (artistsAll ?? []).length;
    const unverified = (artistsAll ?? []).filter((a) => !a.verified);
    const totalBookings = (bookingsAll ?? []).length;
    const revenue = (paymentsAll ?? []).filter((p) => p.status === "paid" || p.status === "advance_paid").reduce((s, p) => s + Number(p.amount), 0);
    setStats({ totalArtists, unverified: unverified.length, totalBookings, revenue });
    setPendingArtists(unverified.map((a) => ({ id: a.id, name: a.name, city: a.city, created_at: a.created_at })));

    // Monthly aggregation (last 7 months)
    const buckets: Record<string, { bookings: number; revenue: number }> = {};
    const now = new Date();
    const labels: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      labels.push(d.toLocaleDateString("en-IN", { month: "short" }));
      buckets[key] = { bookings: 0, revenue: 0 };
    }
    (bookingsAll ?? []).forEach((b) => {
      const d = new Date(b.booking_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (buckets[key]) {
        buckets[key].bookings += 1;
        buckets[key].revenue += Number(b.amount);
      }
    });
    setMonthly(Object.entries(buckets).map(([, v], i) => ({ label: labels[i], ...v })));
  };

  const verifyArtist = async (id: string) => {
    const { error } = await supabase.from("artists").update({ verified: true }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Artist verified ✨");
    loadStats();
  };

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
      loadStats();
    }
  }, [isAdmin]);

  const grantRole = async (userId: string, newRole: AppRole) => {
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Granted ${newRole}`);
    loadUsers();
  };

  const revokeRole = async (userId: string, oldRole: AppRole) => {
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", oldRole);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Revoked ${oldRole}`);
    loadUsers();
  };

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.email?.toLowerCase().includes(q) || u.display_name?.toLowerCase().includes(q) || u.id.includes(q));
  });

  if (!roleLoading && !isAdmin) {
    return (
      <div className="glass rounded-3xl p-10 text-center">
        <Shield className="size-10 mx-auto text-primary mb-3" />
        <h2 className="text-xl font-semibold">Admins only</h2>
        <p className="text-sm text-muted-foreground mt-2">You don't have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Overview</h1>
        <p className="text-muted-foreground">Real-time platform stats</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={String(users.length)} change={`${users.filter(u => u.roles.includes("customer")).length} customers`} />
        <StatCard icon={Sparkles} label="Total Artists" value={String(stats.totalArtists)} change={`${stats.unverified} pending verify`} />
        <StatCard icon={Calendar} label="Total Bookings" value={String(stats.totalBookings)} change="All-time" />
        <StatCard icon={DollarSign} label="Revenue" value={`₹${stats.revenue.toLocaleString("en-IN")}`} change="Paid + advance" />
      </div>

      {/* Chart */}
      <div className="bg-card rounded-3xl shadow-card p-6">
        <h3 className="font-semibold text-lg mb-6">Bookings & Revenue — Last 7 months</h3>
        <div className="flex items-end justify-between gap-3 h-48">
          {monthly.map((m, i) => {
            const max = Math.max(...monthly.map(x => x.bookings), 1);
            const h = (m.bookings / max) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2" title={`${m.bookings} bookings · ₹${m.revenue.toLocaleString("en-IN")}`}>
                <div className="w-full rounded-t-xl gradient-rose shadow-glow transition-all hover:opacity-80" style={{ height: `${Math.max(h, 4)}%` }} />
                <div className="text-xs text-muted-foreground">{m.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending verifications */}
      {pendingArtists.length > 0 && (
        <div className="bg-card rounded-3xl shadow-card p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Shield className="size-5 text-primary" /> Pending artist verifications ({pendingArtists.length})
          </h3>
          <div className="space-y-2">
            {pendingArtists.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-blush/30">
                <div>
                  <div className="font-medium">{a.name}</div>
                  <div className="text-xs text-muted-foreground">{a.city ?? "—"}</div>
                </div>
                <Button size="sm" className="gradient-rose text-white border-0" onClick={() => verifyArtist(a.id)}>Verify</Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users & Roles management */}
      <div className="bg-card rounded-3xl shadow-card p-6" id="users">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Shield className="size-5 text-primary" /> Users & Roles
            </h3>
            <p className="text-xs text-muted-foreground">Promote users to admin or artist. Revoke with one click.</p>
          </div>
          <Input
            placeholder="Search by name, email or id…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground tracking-wider">
              <tr className="border-b">
                <th className="text-left py-3">User</th>
                <th className="text-left py-3">Email</th>
                <th className="text-left py-3">Roles</th>
                <th className="text-right py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingUsers && (
                <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">Loading users…</td></tr>
              )}
              {!loadingUsers && filtered.length === 0 && (
                <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">No users found.</td></tr>
              )}
              {filtered.map((u) => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-blush/30 align-top">
                  <td className="py-3 font-medium">{u.display_name || "—"}</td>
                  <td className="py-3 text-muted-foreground">{u.email || <span className="font-mono text-xs">{u.id.slice(0, 8)}…</span>}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {u.roles.length === 0 && <span className="text-xs text-muted-foreground">none</span>}
                      {u.roles.map((r) => (
                        <Badge
                          key={r}
                          className={
                            r === "admin"
                              ? "bg-primary/10 text-primary border-0"
                              : r === "artist"
                              ? "bg-accent/40 text-deep-rose border-0"
                              : "bg-muted text-foreground/70 border-0"
                          }
                        >
                          {r}
                          <button
                            onClick={() => revokeRole(u.id, r)}
                            className="ml-1.5 hover:text-destructive"
                            title={`Revoke ${r}`}
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 text-right">
                    <div className="inline-flex flex-wrap gap-1.5 justify-end">
                      {(["customer", "artist", "admin"] as AppRole[]).map((r) =>
                        u.roles.includes(r) ? null : (
                          <Button
                            key={r}
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => grantRole(u.id, r)}
                          >
                            <UserPlus className="size-3" /> {r}
                          </Button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Promo codes management */}
      <PromoCodesManager />

      {/* Categories teaser (Phase 2 will wire CRUD) */}
      <div className="bg-card rounded-3xl shadow-card p-6" id="categories">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Tag className="size-5 text-primary" /> Categories
        </h3>
        <p className="text-sm text-muted-foreground mb-3">Service categories used across the marketplace.</p>
        <div className="flex flex-wrap gap-2">
          {["Bridal Makeup", "Party Makeup", "HD Makeup", "Mehndi", "Bridal Mehndi", "Hair Styling", "Saree Draping", "Nail Art"].map((c) => (
            <Badge key={c} className="bg-blush/60 text-deep-rose border-0">{c}</Badge>
          ))}
        </div>
      </div>

      {/* Existing demo artists table preserved */}
      <div className="bg-card rounded-3xl shadow-card p-6">
        <h3 className="font-semibold text-lg mb-4">Featured Artists (demo data)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground tracking-wider">
              <tr className="border-b">
                <th className="text-left py-3">Artist</th>
                <th className="text-left py-3">City</th>
                <th className="text-left py-3">Rating</th>
                <th className="text-left py-3">Status</th>
                <th className="text-right py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {artists.map((a) => (
                <tr key={a.id} className="border-b last:border-0 hover:bg-blush/30">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <img src={a.image} alt="" className="size-9 rounded-lg object-cover" />
                      <span className="font-medium">{a.name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-muted-foreground">{a.city}</td>
                  <td className="py-3">⭐ {a.rating}</td>
                  <td className="py-3">
                    <Badge className="bg-primary/10 text-primary border-0">Verified</Badge>
                  </td>
                  <td className="py-3 text-right">
                    <Button variant="ghost" size="sm" className="text-destructive">
                      <Trash2 className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
