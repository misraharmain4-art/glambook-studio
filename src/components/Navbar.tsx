import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/glambook-logo.png";

const links = [
  { label: "Home", to: "/" as const, hash: "" },
  { label: "Artists", to: "/" as const, hash: "#artists" },
  { label: "Services", to: "/" as const, hash: "#services" },
  { label: "About", to: "/" as const, hash: "#about" },
  { label: "Contact", to: "/" as const, hash: "#contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled ? "py-2" : "py-4"
      }`}
    >
      <div
        className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 transition-all duration-500 ${
          scrolled ? "glass shadow-soft rounded-2xl mx-3 sm:mx-6" : ""
        }`}
      >
        <nav className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="size-10 rounded-full overflow-hidden shadow-glow ring-2 ring-primary/30">
              <img src={logo} alt="GlamBook logo" className="size-full object-cover" />
            </div>
            <span className="font-display text-2xl font-bold tracking-tight">
              Glam<span className="text-gradient">Book</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.hash || "/"}
                className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors relative group"
              >
                {l.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 gradient-rose group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" className="text-sm">Login</Button>
            </Link>
            <Link to="/dashboard/customer">
              <Button className="gradient-rose text-white hover:opacity-90 shadow-glow border-0">
                Book Now
              </Button>
            </Link>
          </div>

          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-lg hover:bg-secondary"
            aria-label="Menu"
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </nav>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden"
            >
              <div className="py-4 flex flex-col gap-3">
                {links.map((l) => (
                  <a
                    key={l.label}
                    href={l.hash || "/"}
                    onClick={() => setOpen(false)}
                    className="px-3 py-2 rounded-lg hover:bg-secondary text-sm font-medium"
                  >
                    {l.label}
                  </a>
                ))}
                <div className="flex gap-2 pt-2">
                  <Link to="/login" className="flex-1">
                    <Button variant="outline" className="w-full">Login</Button>
                  </Link>
                  <Link to="/dashboard/customer" className="flex-1">
                    <Button className="w-full gradient-rose text-white border-0">Book Now</Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
