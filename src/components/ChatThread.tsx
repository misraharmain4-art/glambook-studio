import { useEffect, useRef, useState } from "react";
import { Send, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Message = {
  id: string;
  booking_id: string;
  sender_id: string;
  body: string;
  read: boolean;
  created_at: string;
};

type Props = {
  bookingId: string;
  /** Other participant's display name (for the header) */
  peerName?: string;
};

export function ChatThread({ bookingId, peerName }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initial load + realtime subscription
  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: true });
      if (active) setMessages((data as Message[]) ?? []);
    };
    load();

    const channel = supabase
      .channel(`messages:${bookingId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `booking_id=eq.${bookingId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [bookingId]);

  // Mark peer messages as read whenever new ones arrive
  useEffect(() => {
    if (!user) return;
    const unread = messages.filter((m) => m.sender_id !== user.id && !m.read).map((m) => m.id);
    if (unread.length === 0) return;
    supabase.from("messages").update({ read: true }).in("id", unread).then(() => {});
  }, [messages, user]);

  // Autoscroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!user || !body.trim()) return;
    setSending(true);
    const text = body.trim();
    setBody("");
    const { error } = await supabase.from("messages").insert({
      booking_id: bookingId,
      sender_id: user.id,
      body: text,
    });
    setSending(false);
    if (error) {
      toast.error(error.message);
      setBody(text);
    }
  };

  return (
    <div className="flex flex-col h-[480px] bg-card rounded-3xl shadow-card overflow-hidden border">
      <div className="px-5 py-3 border-b bg-blush/30 flex items-center gap-2">
        <MessageCircle className="size-4 text-primary" />
        <div className="font-semibold text-sm">Chat with {peerName ?? "the other party"}</div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {messages.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground py-8">
            No messages yet — say hello! 💬
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[78%] px-4 py-2 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    mine
                      ? "gradient-rose text-white rounded-br-md"
                      : "bg-blush/40 text-foreground rounded-bl-md"
                  }`}
                >
                  <div>{m.body}</div>
                  <div className={`text-[10px] mt-1 ${mine ? "text-white/70" : "text-muted-foreground"}`}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="border-t p-3 flex gap-2 bg-card"
      >
        <Input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type a message…"
          className="flex-1"
          maxLength={2000}
        />
        <Button type="submit" disabled={sending || !body.trim()} className="gradient-rose text-white border-0 shadow-glow">
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
