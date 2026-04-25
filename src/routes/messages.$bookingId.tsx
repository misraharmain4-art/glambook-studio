import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Calendar, Clock, MapPin } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { ChatThread } from "@/components/ChatThread";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { formatDate, statusColor, formatINR } from "@/lib/format";

export const Route = createFileRoute("/messages/$bookingId")({
  component: MessagesPage,
});

type BookingDetail = {
  id: string;
  customer_id: string;
  artist_id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  amount: number;
  customer_address: string | null;
  artists: { name: string; user_id: string; image_url: string | null } | null;
  profiles: { display_name: string | null; avatar_url: string | null } | null;
};

function MessagesPage() {
  const { bookingId } = useParams({ from: "/messages/$bookingId" });
  const { user } = useAuth();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("bookings")
        .select("id, customer_id, artist_id, booking_date, booking_time, status, amount, customer_address, artists(name, user_id, image_url), profiles!bookings_customer_id_fkey(display_name, avatar_url)")
        .eq("id", bookingId)
        .maybeSingle();
      setBooking((data as unknown as BookingDetail) ?? null);
      setLoading(false);
    })();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blush/20 via-background to-champagne/20">
        <Navbar />
        <div className="pt-28 max-w-4xl mx-auto px-4">
          <div className="h-96 bg-card rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blush/20 via-background to-champagne/20">
        <Navbar />
        <div className="pt-28 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-semibold">Conversation not found</h1>
          <Link to="/dashboard" className="text-primary mt-3 inline-block">← Back to dashboard</Link>
        </div>
      </div>
    );
  }

  const isCustomer = user?.id === booking.customer_id;
  const peerName = isCustomer
    ? booking.artists?.name ?? "Artist"
    : booking.profiles?.display_name ?? "Customer";
  const backLink = isCustomer ? "/dashboard/customer" : "/dashboard/artist";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blush/20 via-background to-champagne/20">
      <Navbar />
      <main className="pt-28 pb-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Link to={backLink} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
            <ChevronLeft className="size-4" /> Back to dashboard
          </Link>

          <div className="grid lg:grid-cols-[1fr_320px] gap-5">
            <ChatThread bookingId={booking.id} peerName={peerName} />

            <aside className="bg-card rounded-3xl shadow-card p-5 h-fit">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Booking details</div>
              <div className="font-display italic text-xl">{peerName}</div>
              <Badge variant="outline" className={`${statusColor(booking.status)} mt-2`}>{booking.status}</Badge>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="size-3.5" /> {formatDate(booking.booking_date)}</div>
                <div className="flex items-center gap-2 text-muted-foreground"><Clock className="size-3.5" /> {booking.booking_time.slice(0, 5)}</div>
                {booking.customer_address && (
                  <div className="flex items-start gap-2 text-muted-foreground"><MapPin className="size-3.5 mt-0.5" /> <span className="break-words">{booking.customer_address}</span></div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Amount</span>
                <span className="font-bold">{formatINR(booking.amount)}</span>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
