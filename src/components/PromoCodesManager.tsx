import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Tag, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type PromoRow = {
  id: string;
  code: string;
  description: string | null;
  discount_percent: number | null;
  discount_flat: number | null;
  min_order: number;
  max_uses: number | null;
  uses_count: number;
  starts_at: string | null;
  expires_at: string | null;
  active: boolean;
};

export function PromoCodesManager() {
  const [codes, setCodes] = useState<PromoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PromoRow | "new" | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("promo_codes").select("*").order("created_at", { ascending: false });
    setCodes((data as PromoRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async (form: Partial<PromoRow> & { code: string }) => {
    const payload = {
      code: form.code.toUpperCase().trim(),
      description: form.description ?? null,
      discount_percent: form.discount_percent ?? null,
      discount_flat: form.discount_flat ?? null,
      min_order: form.min_order ?? 0,
      max_uses: form.max_uses ?? null,
      starts_at: form.starts_at ?? null,
      expires_at: form.expires_at ?? null,
      active: form.active ?? true,
    };
    if (editing && editing !== "new") {
      const { error } = await supabase.from("promo_codes").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("promo_codes").insert(payload);
      if (error) return toast.error(error.message);
    }
    toast.success("Promo code saved");
    setEditing(null);
    load();
  };

  const toggleActive = async (row: PromoRow) => {
    const { error } = await supabase.from("promo_codes").update({ active: !row.active }).eq("id", row.id);
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this promo code?")) return;
    const { error } = await supabase.from("promo_codes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  const formatDiscount = (p: PromoRow) => {
    if (p.discount_percent) return `${p.discount_percent}% off`;
    if (p.discount_flat) return `₹${Number(p.discount_flat).toLocaleString("en-IN")} off`;
    return "—";
  };

  return (
    <div className="bg-card rounded-3xl shadow-card p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Tag className="size-5 text-primary" /> Promo codes
          </h3>
          <p className="text-xs text-muted-foreground">Create and manage discount codes for customers.</p>
        </div>
        <Button onClick={() => setEditing("new")} size="sm" className="gradient-rose text-white border-0 shadow-glow">
          <Plus className="size-4" /> New code
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground text-center py-6">Loading…</div>
      ) : codes.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-8">No promo codes yet. Create your first one.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground tracking-wider">
              <tr className="border-b">
                <th className="text-left py-3">Code</th>
                <th className="text-left py-3">Discount</th>
                <th className="text-left py-3">Min order</th>
                <th className="text-left py-3">Uses</th>
                <th className="text-left py-3">Expires</th>
                <th className="text-left py-3">Status</th>
                <th className="text-right py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-blush/30">
                  <td className="py-3 font-mono font-semibold">{p.code}</td>
                  <td className="py-3">{formatDiscount(p)}</td>
                  <td className="py-3 text-muted-foreground">₹{Number(p.min_order).toLocaleString("en-IN")}</td>
                  <td className="py-3 text-muted-foreground">{p.uses_count}{p.max_uses ? ` / ${p.max_uses}` : ""}</td>
                  <td className="py-3 text-muted-foreground">{p.expires_at ? new Date(p.expires_at).toLocaleDateString("en-IN") : "—"}</td>
                  <td className="py-3">
                    <Badge className={p.active ? "bg-emerald-500/10 text-emerald-600 border-0" : "bg-muted text-foreground/70 border-0"}>
                      {p.active ? "active" : "inactive"}
                    </Badge>
                  </td>
                  <td className="py-3 text-right">
                    <div className="inline-flex gap-1">
                      <button onClick={() => toggleActive(p)} className="text-muted-foreground hover:text-primary p-1" title={p.active ? "Deactivate" : "Activate"}>
                        <Power className="size-3.5" />
                      </button>
                      <button onClick={() => setEditing(p)} className="text-muted-foreground hover:text-primary p-1" title="Edit">
                        <Pencil className="size-3.5" />
                      </button>
                      <button onClick={() => remove(p.id)} className="text-muted-foreground hover:text-destructive p-1" title="Delete">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display italic">{editing === "new" ? "New promo code" : "Edit promo code"}</DialogTitle>
            <DialogDescription>Fill either percent OR flat discount — not both.</DialogDescription>
          </DialogHeader>
          {editing && (
            <PromoForm
              initial={editing === "new" ? null : editing}
              onSave={save}
              onCancel={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PromoForm({ initial, onSave, onCancel }: { initial: PromoRow | null; onSave: (f: Partial<PromoRow> & { code: string }) => void; onCancel: () => void }) {
  const [code, setCode] = useState(initial?.code ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [percent, setPercent] = useState(initial?.discount_percent != null ? String(initial.discount_percent) : "");
  const [flat, setFlat] = useState(initial?.discount_flat != null ? String(initial.discount_flat) : "");
  const [minOrder, setMinOrder] = useState(String(initial?.min_order ?? 0));
  const [maxUses, setMaxUses] = useState(initial?.max_uses != null ? String(initial.max_uses) : "");
  const [expiresAt, setExpiresAt] = useState(initial?.expires_at ? initial.expires_at.slice(0, 10) : "");
  const [active, setActive] = useState(initial?.active ?? true);

  const submit = () => {
    if (!code.trim()) return toast.error("Code is required");
    if (!percent && !flat) return toast.error("Set either a percent or flat discount");
    if (percent && flat) return toast.error("Use either percent or flat — not both");
    onSave({
      code: code.trim(),
      description: description || null,
      discount_percent: percent ? Number(percent) : null,
      discount_flat: flat ? Number(flat) : null,
      min_order: Number(minOrder) || 0,
      max_uses: maxUses ? Number(maxUses) : null,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      active,
    });
  };

  return (
    <div className="grid gap-3">
      <div>
        <Label className="text-xs">Code</Label>
        <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="GLAM10" className="font-mono" />
      </div>
      <div>
        <Label className="text-xs">Description (optional)</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="10% off your first booking" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Discount %</Label>
          <Input type="number" value={percent} onChange={(e) => { setPercent(e.target.value); if (e.target.value) setFlat(""); }} placeholder="10" />
        </div>
        <div>
          <Label className="text-xs">Flat (₹)</Label>
          <Input type="number" value={flat} onChange={(e) => { setFlat(e.target.value); if (e.target.value) setPercent(""); }} placeholder="500" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Min order (₹)</Label>
          <Input type="number" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Max uses (blank = unlimited)</Label>
          <Input type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} />
        </div>
      </div>
      <div>
        <Label className="text-xs">Expires on (optional)</Label>
        <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        Active
      </label>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={submit} className="gradient-rose text-white border-0">Save code</Button>
      </DialogFooter>
    </div>
  );
}
