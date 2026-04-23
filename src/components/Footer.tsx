import { Instagram, Twitter, Facebook, Mail } from "lucide-react";
import logo from "@/assets/glambook-logo.png";

export function Footer() {
  return (
    <footer id="contact" className="bg-gradient-to-br from-deep-rose to-primary text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="size-10 rounded-full overflow-hidden bg-white/20 backdrop-blur ring-2 ring-white/30">
                <img src={logo} alt="GlamBook logo" className="size-full object-cover" />
              </div>
              <span className="font-display text-2xl font-bold">GlamBook</span>
            </div>
            <p className="text-sm text-white/80 leading-relaxed">
              India's premium platform to book trusted makeup & mehndi artists.
            </p>
            <div className="flex gap-3 mt-5">
              {[Instagram, Twitter, Facebook, Mail].map((I, i) => (
                <a key={i} href="#" className="size-9 rounded-full bg-white/15 hover:bg-white/30 grid place-items-center transition">
                  <I className="size-4" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Company</h4>
            <ul className="space-y-2 text-sm text-white/80">
              <li><a href="#about" className="hover:text-white">About</a></li>
              <li><a href="#" className="hover:text-white">Careers</a></li>
              <li><a href="#" className="hover:text-white">Press</a></li>
              <li><a href="#" className="hover:text-white">Blog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2 text-sm text-white/80">
              <li><a href="#artists" className="hover:text-white">Browse Artists</a></li>
              <li><a href="#services" className="hover:text-white">Services</a></li>
              <li><a href="#" className="hover:text-white">Become an Artist</a></li>
              <li><a href="#" className="hover:text-white">Help Center</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Contact</h4>
            <ul className="space-y-2 text-sm text-white/80">
              <li>hello@glambook.in</li>
              <li>+91 98765 43210</li>
              <li>Mumbai · Delhi · Bangalore</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-white/15 flex flex-col md:flex-row justify-between gap-3 text-sm text-white/70">
          <div>© 2026 GlamBook. All rights reserved.</div>
          <div className="flex gap-5">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
