import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

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
              animate={{ scale: [1, 1.15, 1], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="size-20 rounded-3xl gradient-rose grid place-items-center mx-auto mb-5 shadow-glow"
            >
              <Sparkles className="size-10 text-white" />
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
