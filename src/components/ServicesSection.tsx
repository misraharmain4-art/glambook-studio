import { motion } from "framer-motion";
import mehndi from "@/assets/service-mehndi.jpg";
import makeup from "@/assets/service-makeup.jpg";
import hair from "@/assets/service-hair.jpg";
import bridal from "@/assets/hero-bridal.jpg";

const services = [
  { name: "Bridal Makeup", img: bridal, price: "₹4,999+", desc: "Full bridal glam" },
  { name: "Party Makeup", img: makeup, price: "₹1,999+", desc: "HD finish" },
  { name: "Mehndi Design", img: mehndi, price: "₹999+", desc: "Trendy patterns" },
  { name: "Wedding Mehndi", img: mehndi, price: "₹3,499+", desc: "Bride + family" },
  { name: "Hair Styling", img: hair, price: "₹1,499+", desc: "Updos & blow-dry" },
  { name: "Saree Draping", img: bridal, price: "₹799+", desc: "Designer drapes" },
  { name: "Nail Art", img: makeup, price: "₹699+", desc: "Gel & extensions" },
  { name: "Pre-Wedding Pkg", img: hair, price: "₹14,999+", desc: "Complete care" },
];

export function ServicesSection() {
  return (
    <section id="services" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-sm uppercase tracking-[0.2em] text-primary font-semibold">Our Services</span>
          <h2 className="text-4xl md:text-5xl font-bold mt-3">
            Curated <span className="text-gradient">beauty experiences</span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {services.map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="relative h-72 rounded-3xl overflow-hidden cursor-pointer group shadow-card"
            >
              <img
                src={s.img}
                alt={s.name}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <div className="text-xs uppercase tracking-widest opacity-80 mb-1">{s.desc}</div>
                <h3 className="text-xl font-semibold mb-1">{s.name}</h3>
                <div className="text-sm font-medium text-gradient bg-white/90 inline-block px-3 py-1 rounded-full">
                  {s.price}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
