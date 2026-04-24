import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, dashboardPathForRole } from "@/components/AuthProvider";
import logo from "@/assets/glambook-logo.png";

export const Route = createFileRoute("/signup/artist")({
  head: () => ({
    meta: [
      { title: "Join as artist — GlamBook" },
      { name: "description", content: "Create your GlamBook artist profile and start receiving bookings." },
    ],
  }),
  component: ArtistSignup,
});

const artistSchema = z.object({
  displayName: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
  city: z.string().trim().min(2, "City is required").max(80),
  bio: z.string().trim().max(500).optional(),
  specialties: z.string().trim().max(255).optional(),
});

function ArtistSignup() {
  const navigate = useNavigate();
  const { session, loading, role, roleLoading } = useAuth();
  const [form, setForm] = useState({ displayName: "", email: "", password: "", city: "", bio: "", specialties: "" });
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session && !roleLoading) {
      navigate({ to: dashboardPathForRole(role) });
    }
  }, [loading, session, role, roleLoading, navigate]);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const parsed = artistSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSubmitting(true);
    try {
      const { error: err } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard/artist`,
          data: {
            display_name: parsed.data.displayName,
            role: "artist",
            city: parsed.data.city,
            bio: parsed.data.bio,
            specialties: parsed.data.specialties,
          },
        },
      });
      if (err) throw err;
      setInfo("Account created. Check your email to confirm, then sign in to set up your portfolio.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero grid place-items-center p-6">
      <div className="w-full max-w-2xl glass rounded-3xl p-8 lg:p-10 shadow-lux">
        <Link to="/" className="flex items-center gap-2 mb-6">
          <div className="size-10 rounded-full overflow-hidden shadow-glow ring-2 ring-primary/30">
            <img src={logo} alt="GlamBook" className="size-full object-cover" />
          </div>
          <span className="font-display text-2xl font-bold italic">Glam<span className="text-gradient">Book</span></span>
        </Link>

        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="size-5 text-primary" />
          <span className="text-xs uppercase tracking-widest text-primary font-semibold">Artist application</span>
        </div>
        <h1 className="text-3xl font-bold mb-1">Join as a beauty artist</h1>
        <p className="text-sm text-muted-foreground mb-6">Create a free profile, list your services, and get bookings.</p>

        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium">Full name *</label>
            <Input value={form.displayName} onChange={update("displayName")} placeholder="e.g. Aanya Kapoor" maxLength={100} required className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium">Email *</label>
            <Input type="email" value={form.email} onChange={update("email")} placeholder="you@example.com" maxLength={255} required className="mt-1" autoComplete="email" />
          </div>
          <div>
            <label className="text-xs font-medium">Password *</label>
            <Input type="password" value={form.password} onChange={update("password")} placeholder="••••••••" minLength={6} maxLength={72} required className="mt-1" autoComplete="new-password" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium">City *</label>
            <Input value={form.city} onChange={update("city")} placeholder="e.g. Mumbai" maxLength={80} required className="mt-1" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium">Specialties</label>
            <Input value={form.specialties} onChange={update("specialties")} placeholder="Bridal Makeup, HD Makeup, Hair (comma separated)" maxLength={255} className="mt-1" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium">Short bio</label>
            <Textarea value={form.bio} onChange={update("bio")} placeholder="Tell customers about your experience and style…" maxLength={500} className="mt-1" rows={4} />
          </div>

          {error && <div className="sm:col-span-2 text-sm text-destructive" role="alert">{error}</div>}
          {info && <div className="sm:col-span-2 text-sm text-primary" role="status">{info}</div>}

          <Button type="submit" disabled={submitting} className="sm:col-span-2 w-full gradient-rose text-white border-0 shadow-glow">
            {submitting ? "Creating account…" : "Create artist account"}
          </Button>
        </form>

        <div className="text-center text-xs text-muted-foreground mt-6">
          Already on GlamBook?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </div>
        <p className="text-[11px] text-muted-foreground/80 text-center mt-3">
          New artist accounts require admin verification before being shown publicly.
        </p>
      </div>
    </div>
  );
}
