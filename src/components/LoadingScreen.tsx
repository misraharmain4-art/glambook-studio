import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/glambook-logo.png";

export function LoadingScreen() {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 1400);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-[200] grid place-items-center gradient-hero"
        >
          <div className="text-center">
            <motion.div
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="size-44 md:size-52 rounded-full overflow-hidden mx-auto mb-7 shadow-lux ring-4 ring-primary/30 relative"
            >
              <div className="absolute inset-0 rounded-full ring-[10px] ring-primary/10 animate-pulse" />
              <img src={logo} alt="GlamBook logo" className="size-full object-cover relative" />
            </motion.div>
            <div className="font-display text-4xl md:text-5xl font-bold italic tracking-tight">
              Glam<span className="text-gradient">Book</span>
            </div>
            <div className="text-xs md:text-sm text-muted-foreground mt-3 tracking-[0.3em] uppercase">Loading beauty</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
