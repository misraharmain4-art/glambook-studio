import { useEffect, useState } from "react";
import { Calendar, Clock, MapPin, CreditCard, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { formatINR } from "@/lib/format";

type Service = {
  id: string;
  title: string;
  price: number;
  duration_minutes: number;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  artist: { id: string; name: string; user_id: string; base_price: number | null } | null;
  onBooked?: () => void;
};

export function BookingDialog({ open, onOpenChange, artist, onBooked }: Props) {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState<string>("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [method, setMethod] = useState<"upi" | "cash" | "card" | "netbanking">("upi");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !artist) return;
    setServiceId("");
    setDate("");
    setTime("");
    setAddress("");
    setNotes("");
    setMethod("upi");
    supabase
      .from("services")
      .select("id, title, price, duration_minutes")
      .eq("artist_id", artist.id)
      .eq("active", true)
      .then(({ data }) => setServices(data ?? []));
  }, [open, artist]);

  const selectedService = services.find((s) => s.id === serviceId);
  const amount = selectedService?.price ?? artist?.base_price ?? 0;

  const submit = async () => {
    if (!user) {
      toast.error("Please sign in to book");
      return;
    }
    if (!artist) return;
    if (!date || !time) {
      toast.error("Pick a date and time");
      return;
    }
    if (!address.trim()) {
      toast.error("Add a service address");
      return;
    }

    setSubmitting(true);
    try {
      const { data: booking, error } = await supabase
        .from("bookings")
        .insert({
          customer_id: user.id,
          artist_id: artist.id,
          service_id: serviceId || null,
          booking_date: date,
          booking_time: time,
          customer_address: address,
          notes: notes || null,
          amount,
          status: "pending",
          payment_status: method === "cash" ? "unpaid" : "advance_paid",
        })
        .select("id")
        .single();
      if (error) throw error;

      // Demo payment record (advance) for non-cash methods
      if (booking && method !== "cash") {
        await supabase.from("payments").insert({
          booking_id: booking.id,
          customer_id: user.id,
          amount: Math.round(amount * 0.2), // 20% advance demo
          method,
          status: "advance_paid",
          txn_ref: `DEMO-${Date.now().toString(36).toUpperCase()}`,
        });
      }

      // Notify customer
      await supabase.from("notifications").insert({
        user_id: user.id,
        type: "booking_created",
        title: "Booking placed",
        body: `Your booking with ${artist.name} on ${date} at ${time} is pending confirmation.`,
        link: "/dashboard/customer",
      });
      // Notify artist (allowed via admin policy or inserter own; we let admin policy handle, but artist can be notified via their own user_id self-insert isn't possible. Use their user_id from artists.user_id)
      await supabase.from("notifications").insert({
        user_id: artist.user_id,
        type: "booking_request",
        title: "New booking request",
        body: `New request for ${date} at ${time}. Amount ${formatINR(amount)}.`,
        link: "/dashboard/artist",
      });

      toast.success("Booking requested! ✨");
      onOpenChange(false);
      onBooked?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg glass border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display italic">
            <Sparkles className="size-5 text-primary" /> Book {artist?.name}
          </DialogTitle>
          <DialogDescription>Pick a service, date and address. Pay later or 20% advance now.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 mt-2">
          <div>
            <Label className="text-xs">Service</Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={services.length ? "Choose a service" : "No services listed — book base price"} />
              </SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.title} — {formatINR(s.price)} · {s.duration_minutes} min
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs flex items-center gap-1"><Calendar className="size-3" /> Date</Label>
              <Input type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1"><Clock className="size-3" /> Time</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1" />
            </div>
          </div>

          <div>
            <Label className="text-xs flex items-center gap-1"><MapPin className="size-3" /> Service address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full address" className="mt-1" />
          </div>

          <div>
            <Label className="text-xs">Notes for artist (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Hair length, skin type, look reference…" className="mt-1" rows={2} />
          </div>

          <div>
            <Label className="text-xs flex items-center gap-1"><CreditCard className="size-3" /> Payment method</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as typeof method)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upi">UPI (20% advance)</SelectItem>
                <SelectItem value="card">Card (20% advance)</SelectItem>
                <SelectItem value="netbanking">Net banking (20% advance)</SelectItem>
                <SelectItem value="cash">Cash on visit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-2xl bg-blush/40 p-4 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Total</div>
              <div className="text-2xl font-bold">{formatINR(amount)}</div>
              {method !== "cash" && (
                <div className="text-xs text-primary">20% advance now: {formatINR(Math.round(amount * 0.2))}</div>
              )}
            </div>
            <Button onClick={submit} disabled={submitting || !artist} className="gradient-rose text-white border-0 shadow-glow">
              {submitting ? "Booking…" : "Confirm booking"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
