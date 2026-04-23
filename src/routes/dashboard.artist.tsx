import { createFileRoute } from "@tanstack/react-router";
import { Calendar, DollarSign, Star, Users, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { artists } from "@/data/artists";

export const Route = createFileRoute("/dashboard/artist")({
  component: ArtistDash,
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

function ArtistDash() {
  const me = artists[0];
  const bookings = [
    { id: "B-1029", client: "Anjali", service: "Bridal Makeup", date: "2026-05-12", status: "Confirmed", amount: 5999 },
    { id: "B-1030", client: "Riya", service: "Mehndi", date: "2026-05-15", status: "Pending", amount: 1499 },
    { id: "B-1031", client: "Pooja", service: "Party Makeup", date: "2026-05-19", status: "Confirmed", amount: 2499 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {me.name.split(" ")[0]} ✨</h1>
          <p className="text-muted-foreground">Here's what's happening with your bookings.</p>
        </div>
        <Button className="gradient-rose text-white border-0 shadow-glow">
          <Plus className="size-4" /> Add Service
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Calendar} label="Bookings" value="34" change="+12% this month" />
        <StatCard icon={DollarSign} label="Earnings" value="₹1,28,400" change="+₹18k this week" />
        <StatCard icon={Star} label="Rating" value="4.9" change={`${me.reviews} reviews`} />
        <StatCard icon={Users} label="Repeat clients" value="62%" change="+8%" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile */}
        <div className="lg:col-span-1 bg-card rounded-3xl shadow-card overflow-hidden">
          <div className="h-32 gradient-rose" />
          <div className="px-6 pb-6 -mt-12">
            <img src={me.image} alt="" className="size-24 rounded-2xl ring-4 ring-card object-cover shadow-lux" />
            <h3 className="font-semibold mt-3 text-lg">{me.name}</h3>
            <div className="text-sm text-muted-foreground">{me.city}</div>
            <div className="flex gap-1.5 flex-wrap mt-3">
              {me.specialties.map((s) => (
                <Badge key={s} className="bg-blush/60 text-deep-rose border-0">{s}</Badge>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">Edit Profile</Button>
          </div>
        </div>

        {/* Bookings */}
        <div className="lg:col-span-2 bg-card rounded-3xl shadow-card p-6" id="bookings">
          <h3 className="font-semibold text-lg mb-4">Recent Bookings</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground tracking-wider">
                <tr className="border-b">
                  <th className="text-left py-3">ID</th>
                  <th className="text-left py-3">Client</th>
                  <th className="text-left py-3">Service</th>
                  <th className="text-left py-3">Date</th>
                  <th className="text-left py-3">Status</th>
                  <th className="text-right py-3">Amount</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-b last:border-0 hover:bg-blush/30 transition">
                    <td className="py-3 font-mono text-xs">{b.id}</td>
                    <td className="py-3 font-medium">{b.client}</td>
                    <td className="py-3 text-muted-foreground">{b.service}</td>
                    <td className="py-3 text-muted-foreground">{b.date}</td>
                    <td className="py-3">
                      <Badge className={b.status === "Confirmed" ? "bg-primary/10 text-primary border-0" : "bg-accent/30 text-deep-rose border-0"}>
                        {b.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-right font-semibold">₹{b.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Portfolio */}
      <div className="bg-card rounded-3xl shadow-card p-6" id="portfolio">
        <div className="flex justify-between mb-4">
          <h3 className="font-semibold text-lg">Portfolio</h3>
          <Button variant="outline" size="sm"><Upload className="size-4" /> Upload</Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {artists.slice(0, 4).map((a) => (
            <div key={a.id} className="aspect-square rounded-2xl overflow-hidden hover-lift">
              <img src={a.image} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
