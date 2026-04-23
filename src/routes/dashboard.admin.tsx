import { createFileRoute } from "@tanstack/react-router";
import { Users, Sparkles, Calendar, DollarSign, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { artists } from "@/data/artists";

export const Route = createFileRoute("/dashboard/admin")({
  component: AdminDash,
});

function StatCard({ icon: Icon, label, value, change }: any) {
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

function AdminDash() {
  // simple chart data
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul"];
  const heights = [40, 65, 50, 80, 95, 70, 110];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Overview</h1>
        <p className="text-muted-foreground">Real-time platform stats</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value="48,392" change="+9.2%" />
        <StatCard icon={Sparkles} label="Total Artists" value="2,541" change="+124 this month" />
        <StatCard icon={Calendar} label="Total Bookings" value="1,28,490" change="+18% MoM" />
        <StatCard icon={DollarSign} label="Revenue" value="₹4.2 Cr" change="+₹38L this month" />
      </div>

      {/* Chart */}
      <div className="bg-card rounded-3xl shadow-card p-6">
        <h3 className="font-semibold text-lg mb-6">Bookings — Last 7 months</h3>
        <div className="flex items-end justify-between gap-3 h-48">
          {heights.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full rounded-t-xl gradient-rose shadow-glow transition-all hover:opacity-80"
                style={{ height: `${h}%` }}
              />
              <div className="text-xs text-muted-foreground">{months[i]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Users table */}
      <div className="bg-card rounded-3xl shadow-card p-6" id="users">
        <h3 className="font-semibold text-lg mb-4">Manage Artists</h3>
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
