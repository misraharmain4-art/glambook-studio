import { motion } from "framer-motion";
import { Search, MapPin, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import heroImg from "@/assets/hero-bridal.jpg";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-12 overflow-hidden">
      {/* background */}
      <div className="absolute inset-0 gradient-hero" />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, oklch(0.93 0.05 15 / 0.6), transparent 50%), radial-gradient(circle at 80% 80%, oklch(0.86 0.09 45 / 0.5), transparent 50%)",
        }}
      />
      {/* floating orbs */}
      <div className="absolute top-32 left-10 size-72 rounded-full bg-primary/20 blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 size-96 rounded-full bg-accent/30 blur-3xl animate-float" style={{ animationDelay: "2s" }} />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <Sparkles className="size-4 text-primary" />
            <span className="text-xs font-medium tracking-wide">India's #1 Beauty Booking Platform</span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] mb-6">
            Book Trusted
            <br />
            <span className="text-gradient">Makeup & Mehndi</span>
            <br />
            Artists Instantly
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl">
            Find top-rated, verified beauty artists near you. Premium service, transparent pricing, secure payments.
          </p>

          {/* Search */}
          <div className="glass rounded-2xl p-2 shadow-lux max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/60">
                <MapPin className="size-4 text-primary shrink-0" />
                <Input placeholder="Location" className="border-0 bg-transparent focus-visible:ring-0 px-0 h-8" />
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/60">
                <Sparkles className="size-4 text-primary shrink-0" />
                <Input placeholder="Service" className="border-0 bg-transparent focus-visible:ring-0 px-0 h-8" />
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/60">
                <Calendar className="size-4 text-primary shrink-0" />
                <Input type="date" className="border-0 bg-transparent focus-visible:ring-0 px-0 h-8" />
              </div>
              <Button className="gradient-rose text-white border-0 h-12 shadow-glow rounded-xl">
                <Search className="size-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-8">
            <a href="/artists" className="inline-flex items-center px-6 py-3 rounded-xl gradient-rose text-white shadow-glow hover-lift font-medium text-base">
              Book Now
            </a>
            <a href="/signup/artist" className="inline-flex items-center px-6 py-3 rounded-xl border border-primary/30 hover:bg-primary/5 font-medium text-base">
              Become an Artist
            </a>
          </div>

          <div className="flex items-center gap-6 mt-10 pt-6 border-t border-foreground/10">
            <div>
              <div className="text-2xl font-bold">2,500+</div>
              <div className="text-xs text-muted-foreground">Verified Artists</div>
            </div>
            <div>
              <div className="text-2xl font-bold">50K+</div>
              <div className="text-xs text-muted-foreground">Happy Clients</div>
            </div>
            <div>
              <div className="text-2xl font-bold">4.9★</div>
              <div className="text-xs text-muted-foreground">Avg Rating</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="relative hidden lg:block"
        >
          <div className="relative rounded-[2.5rem] overflow-hidden shadow-lux">
            <img
              src={heroImg}
              alt="Bridal makeup and mehndi"
              width={1600}
              height={1100}
              className="w-full h-[600px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-deep-rose/30 to-transparent" />
          </div>
          {/* floating cards */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute -left-6 top-20 glass rounded-2xl p-4 shadow-lux"
          >
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full gradient-rose grid place-items-center text-white text-sm font-bold">
                ★
              </div>
              <div>
                <div className="text-sm font-semibold">4.9 Rating</div>
                <div className="text-xs text-muted-foreground">12,400 reviews</div>
              </div>
            </div>
          </motion.div>
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 4, repeat: Infinity, delay: 1 }}
            className="absolute -right-4 bottom-16 glass rounded-2xl p-4 shadow-lux"
          >
            <div className="text-xs text-muted-foreground">Starting from</div>
            <div className="text-2xl font-bold text-gradient">₹999</div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
