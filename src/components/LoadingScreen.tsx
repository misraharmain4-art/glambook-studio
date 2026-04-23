import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/glambook-logo.png";

export function LoadingScreen() {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[200] grid place-items-center gradient-hero"
        >
          <div className="text-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              className="size-28 rounded-full overflow-hidden mx-auto mb-5 shadow-glow ring-4 ring-primary/30"
            >
              <img src={logo} alt="GlamBook logo" className="size-full object-cover" />
            </motion.div>
            <div className="font-display text-3xl font-bold">
              Glam<span className="text-gradient">Book</span>
            </div>
            <div className="text-sm text-muted-foreground mt-2 tracking-widest">LOADING BEAUTY...</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
