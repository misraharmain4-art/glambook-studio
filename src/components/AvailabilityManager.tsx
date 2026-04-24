import { useEffect, useState } from "react";
import { CalendarDays, Clock, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";

type Slot = {
  id: string;
  artist_id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
};

type Props = { artistId: string };

export function AvailabilityManager({ artistId }: Props) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [start, setStart] = useState("10:00");
  const [end, setEnd] = useState("12:00");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("availability_slots")
      .select("*")
      .eq("artist_id", artistId)
      .gte("slot_date", today)
      .order("slot_date", { ascending: true })
      .order("start_time", { ascending: true });
    setSlots((data as Slot[]) ?? []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artistId]);

  const addSlot = async () => {
    if (!date || !start || !end) return toast.error("Fill all fields");
    if (start >= end) return toast.error("End time must be after start");
    setSaving(true);
    const { error } = await supabase.from("availability_slots").insert({
      artist_id: artistId,
      slot_date: date,
      start_time: start,
      end_time: end,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Slot added");
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("availability_slots").delete().eq("id", id);
    load();
  };

  // Group by date
  const grouped = slots.reduce<Record<string, Slot[]>>((acc, s) => {
    (acc[s.slot_date] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="bg-card rounded-3xl shadow-card p-6">
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <CalendarDays className="size-5 text-primary" /> Availability
      </h3>

      <div className="rounded-2xl border-2 border-dashed border-border bg-blush/20 p-4 mb-5">
        <div className="grid sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Date</Label>
            <Input
              type="date"
              value={date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 bg-white/70 border-0"
            />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">From</Label>
            <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="mt-1 bg-white/70 border-0" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">To</Label>
            <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="mt-1 bg-white/70 border-0" />
          </div>
          <Button onClick={addSlot} disabled={saving} className="gradient-rose text-white border-0 shadow-glow">
            <Plus className="size-4" /> Add
          </Button>
        </div>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          <Clock className="size-8 mx-auto text-primary/40 mb-2" />
          No upcoming slots. Add some so customers can see when you're free.
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([d, list]) => (
            <div key={d}>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{formatDate(d)}</div>
              <div className="flex flex-wrap gap-2">
                {list.map((s) => (
                  <div
                    key={s.id}
                    className={`group inline-flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-full text-sm border transition ${
                      s.is_booked
                        ? "bg-muted text-muted-foreground line-through"
                        : "bg-blush/40 text-deep-rose border-blush hover:bg-blush/60"
                    }`}
                  >
                    <Clock className="size-3" />
                    {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}
                    {s.is_booked && <Badge variant="outline" className="text-[10px] py-0 px-1.5 ml-1">booked</Badge>}
                    {!s.is_booked && (
                      <button
                        onClick={() => remove(s.id)}
                        className="size-5 rounded-full grid place-items-center hover:bg-destructive hover:text-white transition"
                        aria-label="Delete slot"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AvailabilityViewer({ artistId }: { artistId: string }) {
  const [slots, setSlots] = useState<Slot[]>([]);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    supabase
      .from("availability_slots")
      .select("*")
      .eq("artist_id", artistId)
      .eq("is_booked", false)
      .gte("slot_date", today)
      .order("slot_date", { ascending: true })
      .order("start_time", { ascending: true })
      .limit(30)
      .then(({ data }) => setSlots((data as Slot[]) ?? []));
  }, [artistId]);

  if (slots.length === 0) {
    return <div className="text-sm text-muted-foreground">No open slots listed yet — book directly to request a custom time.</div>;
  }

  const grouped = slots.reduce<Record<string, Slot[]>>((acc, s) => {
    (acc[s.slot_date] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([d, list]) => (
        <div key={d}>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{formatDate(d)}</div>
          <div className="flex flex-wrap gap-2">
            {list.map((s) => (
              <span key={s.id} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs bg-blush/40 text-deep-rose">
                <Clock className="size-3" /> {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
