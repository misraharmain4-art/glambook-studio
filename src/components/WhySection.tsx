import { motion } from "framer-motion";
import { ShieldCheck, CalendarCheck, Tag, Star, Camera, Lock } from "lucide-react";

const features = [
  { icon: ShieldCheck, title: "Verified Artists", desc: "Every artist is vetted with ID verification and skill validation." },
  { icon: CalendarCheck, title: "Easy Booking", desc: "Book in under 60 seconds with instant confirmation." },
  { icon: Tag, title: "Transparent Pricing", desc: "No hidden fees. Pay exactly what's quoted." },
  { icon: Star, title: "Reviews & Ratings", desc: "Real reviews from real clients to guide your choice." },
  { icon: Camera, title: "Photo Portfolios", desc: "Browse stunning portfolios before you book." },
  { icon: Lock, title: "Secure Payments", desc: "Bank-grade encryption on every transaction." },
];

export function WhySection() {
  return (
    <section id="about" className="relative py-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm uppercase tracking-[0.2em] text-primary font-semibold">Why GlamBook</span>
          <h2 className="text-4xl md:text-5xl font-bold mt-3 mb-4">
            Beauty booking, <span className="text-gradient">reimagined</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to look and feel stunning — backed by trust, technology, and India's finest artists.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="glass rounded-2xl p-7 hover-lift group"
            >
              <div className="size-14 rounded-2xl gradient-rose grid place-items-center mb-5 shadow-glow group-hover:scale-110 transition-transform">
                <f.icon className="size-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
