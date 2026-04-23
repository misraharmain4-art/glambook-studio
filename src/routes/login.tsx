import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import heroImg from "@/assets/hero-bridal.jpg";
import logo from "@/assets/glambook-logo.png";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Login — GlamBook" }],
  }),
  component: Login,
});

const credentialsSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email" }).max(255),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).max(72),
});

function Login() {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Redirect once authenticated
  useEffect(() => {
    if (!authLoading && session) {
      navigate({ to: "/dashboard/customer" });
    }
  }, [authLoading, session, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = credentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard/customer`,
            data: { display_name: displayName.trim().slice(0, 100) || undefined },
          },
        });
        if (signUpError) throw signUpError;
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (signInError) throw signInError;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard/customer` },
    });
    if (oauthError) setError(oauthError.message);
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
            <div className="size-10 rounded-full overflow-hidden shadow-glow ring-2 ring-primary/30">
              <img src={logo} alt="GlamBook logo" className="size-full object-cover" />
            </div>
            <span className="font-display text-2xl font-bold">Glam<span className="text-gradient">Book</span></span>
          </Link>
          <h1 className="text-3xl font-bold mb-1">{mode === "signin" ? "Sign in" : "Create account"}</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {mode === "signin" ? "Continue to your dashboard" : "Join GlamBook in seconds"}
          </p>

          <Button
            type="button"
            onClick={signInWithGoogle}
            variant="outline"
            className="w-full mb-4"
          >
            Continue with Google
          </Button>

          <div className="flex items-center gap-3 mb-4">
            <div className="h-px bg-border flex-1" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px bg-border flex-1" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="text-xs font-medium">Name</label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  maxLength={100}
                  className="mt-1"
                />
              </div>
            )}
            <div>
              <label className="text-xs font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                maxLength={255}
                className="mt-1"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="text-xs font-medium">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                maxLength={72}
                className="mt-1"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
              />
            </div>
            {error && (
              <div className="text-sm text-destructive" role="alert">{error}</div>
            )}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full gradient-rose text-white border-0 shadow-glow"
            >
              {submitting ? "Please wait..." : mode === "signin" ? "Sign In" : "Create account"}
            </Button>
          </form>
          <div className="text-center text-xs text-muted-foreground mt-6">
            {mode === "signin" ? (
              <>
                New here?{" "}
                <button
                  type="button"
                  onClick={() => { setMode("signup"); setError(null); }}
                  className="text-primary font-medium hover:underline"
                >
                  Create account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => { setMode("signin"); setError(null); }}
                  className="text-primary font-medium hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
