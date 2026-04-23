import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Calendar, Package, User, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Artist } from "@/data/artists";

const steps = [
  { id: 1, label: "Artist", icon: User },
  { id: 2, label: "Date", icon: Calendar },
  { id: 3, label: "Package", icon: Package },
  { id: 4, label: "Confirm", icon: CheckCircle2 },
];

const packages = [
  { name: "Essential", price: 2999, items: ["Basic look", "1 hour session"] },
  { name: "Premium", price: 5999, items: ["HD makeup", "Touch-up kit", "2 hour session"] },
  { name: "Luxury", price: 9999, items: ["Bridal full glam", "Trial included", "Hair styling"] },
];

export function BookingModal({ artist, onClose }: { artist: Artist | null; onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [date, setDate] = useState("");
  const [pkg, setPkg] = useState<string>("Premium");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (artist) {
      setStep(1);
      setDone(false);
    }
  }, [artist]);

  return (
    <AnimatePresence>
      {artist && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] grid place-items-center p-4 bg-deep-rose/30 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-card rounded-3xl shadow-lux overflow-hidden"
          >
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-xl font-semibold">Book {artist.name}</h3>
              <button onClick={onClose} className="size-9 rounded-full hover:bg-secondary grid place-items-center">
                <X className="size-5" />
              </button>
            </div>

            {!done ? (
              <>
                {/* Progress */}
                <div className="px-6 pt-6">
                  <div className="flex items-center justify-between mb-2">
                    {steps.map((s, i) => (
                      <div key={s.id} className="flex items-center flex-1">
                        <div
                          className={`size-9 rounded-full grid place-items-center transition-all ${
                            step >= s.id ? "gradient-rose text-white shadow-glow" : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {step > s.id ? <Check className="size-4" /> : <s.icon className="size-4" />}
                        </div>
                        {i < steps.length - 1 && (
                          <div className={`flex-1 h-1 mx-2 rounded-full ${step > s.id ? "gradient-rose" : "bg-secondary"}`} />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-6">
                    {steps.map((s) => <span key={s.id} className="w-9 text-center">{s.label}</span>)}
                  </div>
                </div>

                <div className="px-6 pb-6 min-h-[280px]">
                  {step === 1 && (
                    <div className="flex gap-4 items-center p-4 rounded-2xl bg-blush/40">
                      <img src={artist.image} alt={artist.name} className="size-20 rounded-2xl object-cover" />
                      <div>
                        <div className="font-semibold text-lg">{artist.name}</div>
                        <div className="text-sm text-muted-foreground">{artist.city} · ⭐ {artist.rating}</div>
                        <div className="text-sm mt-1">Starting ₹{artist.price.toLocaleString()}</div>
                      </div>
                    </div>
                  )}
                  {step === 2 && (
                    <div>
                      <label className="text-sm font-medium block mb-2">Choose your event date</label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  )}
                  {step === 3 && (
                    <div className="grid sm:grid-cols-3 gap-3">
                      {packages.map((p) => (
                        <button
                          key={p.name}
                          onClick={() => setPkg(p.name)}
                          className={`text-left p-4 rounded-2xl border-2 transition-all ${
                            pkg === p.name ? "border-primary bg-blush/40 shadow-soft" : "border-border hover:border-primary/40"
                          }`}
                        >
                          <div className="font-semibold">{p.name}</div>
                          <div className="text-gradient text-xl font-bold my-1">₹{p.price.toLocaleString()}</div>
                          <ul className="text-xs text-muted-foreground space-y-1 mt-2">
                            {p.items.map((i) => <li key={i}>• {i}</li>)}
                          </ul>
                        </button>
                      ))}
                    </div>
                  )}
                  {step === 4 && (
                    <div className="space-y-3">
                      <div className="p-4 rounded-2xl bg-blush/40 space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Artist</span><span className="font-medium">{artist.name}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{date || "Not selected"}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Package</span><span className="font-medium">{pkg}</span></div>
                        <div className="flex justify-between pt-2 border-t border-foreground/10"><span>Total</span><span className="font-bold text-gradient">₹{packages.find(p=>p.name===pkg)?.price.toLocaleString()}</span></div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between p-5 border-t bg-blush/20">
                  <Button variant="ghost" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}>
                    Back
                  </Button>
                  {step < 4 ? (
                    <Button className="gradient-rose text-white border-0 shadow-soft" onClick={() => setStep(step + 1)}>
                      Continue
                    </Button>
                  ) : (
                    <Button className="gradient-rose text-white border-0 shadow-glow" onClick={() => setDone(true)}>
                      Confirm Booking
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="p-12 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="size-20 rounded-full gradient-rose grid place-items-center mx-auto mb-5 shadow-glow"
                >
                  <Check className="size-10 text-white" />
                </motion.div>
                <h3 className="text-2xl font-bold mb-2">Booking Confirmed!</h3>
                <p className="text-muted-foreground mb-6">{artist.name} will reach out shortly to confirm details.</p>
                <Button onClick={onClose} className="gradient-rose text-white border-0">Done</Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
