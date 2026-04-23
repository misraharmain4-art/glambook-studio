import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { reviews } from "@/data/artists";

export function ReviewsSection() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % reviews.length), 5000);
    return () => clearInterval(t);
  }, []);

  const r = reviews[idx];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blush/40 via-background to-champagne/40">
      <div className="mx-auto max-w-4xl text-center">
        <span className="text-sm uppercase tracking-[0.2em] text-primary font-semibold">Testimonials</span>
        <h2 className="text-4xl md:text-5xl font-bold mt-3 mb-12">
          Loved by <span className="text-gradient">brides everywhere</span>
        </h2>

        <div className="relative glass rounded-3xl p-10 md:p-14 shadow-lux">
          <Quote className="size-12 text-primary/30 mx-auto mb-6" />
          <AnimatePresence mode="wait">
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-xl md:text-2xl font-display italic leading-relaxed mb-8 text-foreground/90">
                "{r.text}"
              </p>
              <div className="flex items-center justify-center gap-3">
                <img src={r.image} alt={r.name} className="size-14 rounded-full object-cover ring-2 ring-primary/30" />
                <div className="text-left">
                  <div className="font-semibold">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.role}</div>
                  <div className="flex gap-0.5 mt-1">
                    {[...Array(r.rating)].map((_, i) => (
                      <Star key={i} className="size-3 fill-primary text-primary" />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <button
            onClick={() => setIdx((idx - 1 + reviews.length) % reviews.length)}
            className="absolute left-3 md:-left-5 top-1/2 -translate-y-1/2 size-10 rounded-full bg-white shadow-lux grid place-items-center hover:bg-blush"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            onClick={() => setIdx((idx + 1) % reviews.length)}
            className="absolute right-3 md:-right-5 top-1/2 -translate-y-1/2 size-10 rounded-full bg-white shadow-lux grid place-items-center hover:bg-blush"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        <div className="flex justify-center gap-2 mt-6">
          {reviews.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`h-2 rounded-full transition-all ${i === idx ? "w-8 gradient-rose" : "w-2 bg-foreground/20"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
