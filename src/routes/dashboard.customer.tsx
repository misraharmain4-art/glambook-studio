import { createFileRoute } from "@tanstack/react-router";
import { Calendar, Heart, Star, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { artists } from "@/data/artists";

export const Route = createFileRoute("/dashboard/customer")({
  component: ClientDash,
});

function ClientDash() {
  const upcoming = [
    { artist: artists[0], service: "Bridal Makeup", date: "May 12, 2026", time: "9:00 AM" },
    { artist: artists[1], service: "Bridal Mehndi", date: "May 11, 2026", time: "4:00 PM" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Hello, Ananya 💕</h1>
        <p className="text-muted-foreground">Your beauty plans at a glance.</p>
      </div>

      {/* Upcoming */}
      <div>
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Calendar className="size-5 text-primary" /> Upcoming Appointments
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {upcoming.map((u, i) => (
            <div key={i} className="glass rounded-2xl p-5 flex gap-4 hover-lift">
              <img src={u.artist.image} alt="" className="size-20 rounded-2xl object-cover" />
              <div className="flex-1">
                <div className="font-semibold">{u.artist.name}</div>
                <div className="text-sm text-muted-foreground">{u.service}</div>
                <div className="text-xs mt-2 flex items-center gap-1 text-primary">
                  <Calendar className="size-3" /> {u.date} · {u.time}
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline">Reschedule</Button>
                  <Button size="sm" className="gradient-rose text-white border-0">Details</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Saved artists */}
      <div id="saved">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Heart className="size-5 text-primary" /> Saved Artists
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {artists.slice(0, 4).map((a) => (
            <div key={a.id} className="bg-card rounded-2xl overflow-hidden shadow-card hover-lift">
              <img src={a.image} alt="" className="h-40 w-full object-cover" />
              <div className="p-4">
                <div className="font-semibold">{a.name}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="size-3" /> {a.city}
                </div>
                <div className="text-xs flex items-center gap-1 mt-1">
                  <Star className="size-3 fill-primary text-primary" /> {a.rating}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews */}
      <div id="reviews" className="bg-card rounded-3xl shadow-card p-6">
        <h3 className="font-semibold text-lg mb-4">Your Reviews</h3>
        <div className="space-y-3">
          {[artists[0], artists[2]].map((a) => (
            <div key={a.id} className="flex gap-3 p-3 rounded-xl hover:bg-blush/30">
              <img src={a.image} alt="" className="size-12 rounded-xl object-cover" />
              <div className="flex-1">
                <div className="font-medium text-sm">{a.name}</div>
                <div className="flex gap-0.5 my-1">
                  {[...Array(5)].map((_, i) => <Star key={i} className="size-3 fill-primary text-primary" />)}
                </div>
                <div className="text-xs text-muted-foreground">"Absolutely loved the service. Highly professional!"</div>
              </div>
              <Badge className="bg-blush/60 text-deep-rose border-0 h-fit">Verified</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
