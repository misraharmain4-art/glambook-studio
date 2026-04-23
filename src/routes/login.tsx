import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import heroImg from "@/assets/hero-bridal.jpg";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Login — GlamBook" }],
  }),
  component: Login,
});

function Login() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      window.localStorage.setItem("glambook_user", JSON.stringify({ email }));
    }
    navigate({ to: "/dashboard/client" });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-deep-rose/60 to-primary/40" />
        <div className="relative h-full flex flex-col justify-end p-12 text-white">
          <h2 className="text-4xl font-display font-bold mb-3">Welcome back to GlamBook</h2>
          <p className="text-white/85">Your beauty journey continues here.</p>
        </div>
      </div>

      <div className="grid place-items-center p-6 gradient-hero">
        <div className="w-full max-w-md glass rounded-3xl p-8 shadow-lux">
          <Link to="/" className="flex items-center gap-2 mb-6">
            <div className="size-9 rounded-xl gradient-rose grid place-items-center shadow-glow">
              <Sparkles className="size-5 text-white" />
            </div>
            <span className="font-display text-2xl font-bold">Glam<span className="text-gradient">Book</span></span>
          </Link>
          <h1 className="text-3xl font-bold mb-1">Sign in</h1>
          <p className="text-sm text-muted-foreground mb-6">Continue to your dashboard</p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs font-medium">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium">Password</label>
              <Input type="password" placeholder="••••••••" required className="mt-1" />
            </div>
            <Button type="submit" className="w-full gradient-rose text-white border-0 shadow-glow">
              Sign In
            </Button>
          </form>
          <div className="text-center text-xs text-muted-foreground mt-6">
            New here? <a href="#" className="text-primary font-medium">Create account</a>
          </div>
        </div>
      </div>
    </div>
  );
}
