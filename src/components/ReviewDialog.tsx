import { useState } from "react";
import { Star, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  bookingId: string;
  artistId: string;
  artistName?: string;
  onSubmitted?: () => void;
};

export function ReviewDialog({ open, onOpenChange, bookingId, artistId, artistName, onSubmitted }: Props) {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      customer_id: user.id,
      artist_id: artistId,
      booking_id: bookingId,
      rating,
      comment: comment || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Review posted ✨");
    onOpenChange(false);
    onSubmitted?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display italic"><Sparkles className="size-5 text-primary" /> Rate {artistName ?? "your artist"}</DialogTitle>
          <DialogDescription>Your honest review helps the community.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-1 justify-center my-2">
          {[1,2,3,4,5].map((n) => (
            <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
              <Star className={`size-9 transition ${n <= rating ? "fill-primary text-primary" : "text-muted-foreground/40"}`} />
            </button>
          ))}
        </div>
        <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience…" rows={4} maxLength={500} />
        <Button onClick={submit} disabled={submitting} className="gradient-rose text-white border-0 shadow-glow">
          {submitting ? "Posting…" : "Post review"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
