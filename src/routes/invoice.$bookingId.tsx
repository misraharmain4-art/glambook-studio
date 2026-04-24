import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, Download, ChevronLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { formatINR, formatDate, statusColor } from "@/lib/format";

export const Route = createFileRoute("/invoice/$bookingId")({
  head: () => ({ meta: [{ title: "Invoice — GlamBook" }] }),
  component: InvoicePage,
});

type Booking = {
  id: string;
  booking_date: string;
  booking_time: string;
  amount: number;
  status: string;
  payment_status: string;
  customer_address: string | null;
  notes: string | null;
  created_at: string;
  artists: { name: string; city: string | null } | null;
  services: { title: string; duration_minutes: number } | null;
};

type Payment = { id: string; amount: number; method: string; status: string; txn_ref: string | null; created_at: string };

function InvoicePage() {
  const { bookingId } = useParams({ from: "/invoice/$bookingId" });
  const { user, loading } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setFetching(true);
      const [{ data: b }, { data: p }] = await Promise.all([
        supabase.from("bookings").select("id, booking_date, booking_time, amount, status, payment_status, customer_address, notes, created_at, artists(name, city), services(title, duration_minutes)").eq("id", bookingId).maybeSingle(),
        supabase.from("payments").select("id, amount, method, status, txn_ref, created_at").eq("booking_id", bookingId).order("created_at", { ascending: false }),
      ]);
      setBooking(b as unknown as Booking);
      setPayments((p as Payment[]) ?? []);
      setFetching(false);
    })();
  }, [bookingId, user]);

  const paid = payments.reduce((s, p) => s + Number(p.amount), 0);
  const due = booking ? Number(booking.amount) - paid : 0;

  if (loading || fetching) {
    return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Loading invoice…</div>;
  }
  if (!booking) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="glass rounded-3xl p-10 text-center">
          <h2 className="font-semibold">Invoice not found</h2>
          <Link to="/dashboard/customer" className="text-primary text-sm">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blush/30 via-background to-champagne/30 py-10 print:bg-white">
      <div className="mx-auto max-w-3xl px-4">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link to="/dashboard/customer" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
            <ChevronLeft className="size-4" /> Back
          </Link>
          <Button onClick={() => window.print()} variant="outline"><Download className="size-4" /> Print / Save PDF</Button>
        </div>

        <div className="bg-card rounded-3xl shadow-lux p-8 md:p-10 print:shadow-none print:rounded-none">
          <div className="flex items-start justify-between flex-wrap gap-4 pb-6 border-b">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl gradient-rose grid place-items-center shadow-glow">
                <Sparkles className="size-6 text-white" />
              </div>
              <div>
                <div className="font-display text-3xl font-bold italic">Glam<span className="text-gradient">Book</span></div>
                <div className="text-xs text-muted-foreground">Premium beauty marketplace</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Invoice</div>
              <div className="font-mono text-sm">#{booking.id.slice(0, 8).toUpperCase()}</div>
              <div className="text-xs text-muted-foreground mt-1">{formatDate(booking.created_at)}</div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 mt-6">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Billed to</div>
              <div className="font-semibold">{user?.user_metadata?.display_name ?? user?.email}</div>
              <div className="text-sm text-muted-foreground">{user?.email}</div>
              {booking.customer_address && <div className="text-sm text-muted-foreground mt-1">{booking.customer_address}</div>}
            </div>
            <div className="sm:text-right">
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Artist</div>
              <div className="font-semibold">{booking.artists?.name}</div>
              <div className="text-sm text-muted-foreground">{booking.artists?.city}</div>
            </div>
          </div>

          <div className="mt-8">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b">
                <tr>
                  <th className="text-left py-3">Service</th>
                  <th className="text-left py-3">Date</th>
                  <th className="text-right py-3">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-4">
                    <div className="font-medium">{booking.services?.title ?? "Custom service"}</div>
                    <div className="text-xs text-muted-foreground">{booking.services?.duration_minutes ?? 60} minutes</div>
                  </td>
                  <td className="py-4 text-muted-foreground">{formatDate(booking.booking_date)} · {booking.booking_time.slice(0, 5)}</td>
                  <td className="py-4 text-right font-semibold">{formatINR(booking.amount)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 ml-auto max-w-xs space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatINR(booking.amount)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span>{formatINR(paid)}</span></div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Balance due</span><span className={due > 0 ? "text-amber-600" : "text-emerald-600"}>{formatINR(due)}</span></div>
            <div className="flex justify-end gap-2 pt-2">
              <Badge variant="outline" className={statusColor(booking.status)}>{booking.status}</Badge>
              <Badge variant="outline" className={statusColor(booking.payment_status)}>{booking.payment_status}</Badge>
            </div>
          </div>

          {payments.length > 0 && (
            <div className="mt-8 pt-6 border-t">
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Payments</div>
              <div className="space-y-2">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm rounded-xl bg-blush/30 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-emerald-600" />
                      <div>
                        <div className="font-medium uppercase">{p.method}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{p.txn_ref ?? "—"}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatINR(p.amount)}</div>
                      <div className="text-[10px] text-muted-foreground">{formatDate(p.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-10 pt-6 border-t text-center text-xs text-muted-foreground">
            Thank you for booking with GlamBook · This is a demo invoice for marketplace transactions.
          </div>
        </div>
      </div>
    </div>
  );
}
