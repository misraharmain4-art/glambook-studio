import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { Sparkles, LayoutDashboard, Calendar, Image, DollarSign, User, Heart, Star, Users, BarChart3, Settings } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

const sections = {
  artist: [
    { to: "/dashboard/artist", label: "Overview", icon: LayoutDashboard },
    { to: "/dashboard/artist", label: "Bookings", icon: Calendar, hash: "#bookings" },
    { to: "/dashboard/artist", label: "Portfolio", icon: Image, hash: "#portfolio" },
    { to: "/dashboard/artist", label: "Earnings", icon: DollarSign, hash: "#earnings" },
  ],
  client: [
    { to: "/dashboard/client", label: "My Bookings", icon: Calendar },
    { to: "/dashboard/client", label: "Saved", icon: Heart, hash: "#saved" },
    { to: "/dashboard/client", label: "Reviews", icon: Star, hash: "#reviews" },
    { to: "/dashboard/client", label: "Profile", icon: User, hash: "#profile" },
  ],
  admin: [
    { to: "/dashboard/admin", label: "Overview", icon: BarChart3 },
    { to: "/dashboard/admin", label: "Users", icon: Users, hash: "#users" },
    { to: "/dashboard/admin", label: "Settings", icon: Settings, hash: "#settings" },
  ],
};

function DashboardLayout() {
  const loc = useLocation();
  const role = loc.pathname.includes("artist") ? "artist" : loc.pathname.includes("admin") ? "admin" : "client";
  const items = sections[role as keyof typeof sections];

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blush/30 via-background to-champagne/30">
      <aside className="hidden md:flex w-64 flex-col p-5 glass border-r border-border min-h-screen">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <div className="size-9 rounded-xl gradient-rose grid place-items-center shadow-glow">
            <Sparkles className="size-5 text-white" />
          </div>
          <span className="font-display text-xl font-bold">Glam<span className="text-gradient">Book</span></span>
        </Link>

        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">{role} Panel</div>
        <nav className="flex flex-col gap-1">
          {items.map((i) => (
            <a
              key={i.label}
              href={i.hash || "#"}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-blush/60 transition"
            >
              <i.icon className="size-4 text-primary" />
              {i.label}
            </a>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t">
          <div className="flex flex-col gap-1">
            <Link to="/dashboard/client" className="text-xs px-3 py-2 rounded-lg hover:bg-blush/60">Client view</Link>
            <Link to="/dashboard/artist" className="text-xs px-3 py-2 rounded-lg hover:bg-blush/60">Artist view</Link>
            <Link to="/dashboard/admin" className="text-xs px-3 py-2 rounded-lg hover:bg-blush/60">Admin view</Link>
          </div>
        </div>
      </aside>

      <div className="flex-1 p-6 lg:p-10">
        <Outlet />
      </div>
    </div>
  );
}
