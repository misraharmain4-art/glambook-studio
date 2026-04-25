import { useState } from "react";
import { Tag, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/format";

export type AppliedPromo = {
  id: string;
  code: string;
  discount: number;
};

type Props = {
  amount: number;
  onApplied: (promo: AppliedPromo | null) => void;
  applied: AppliedPromo | null;
};

export function PromoCodeInput({ amount, onApplied, applied }: Props) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apply = async () => {
    setError(null);
    if (!code.trim()) return;
    setLoading(true);
    const { data, error: dbError } = await supabase
      .from("promo_codes")
      .select("id, code, discount_percent, discount_flat, min_order, max_uses, uses_count, starts_at, expires_at, active")
      .ilike("code", code.trim())
      .maybeSingle();
    setLoading(false);

    if (dbError || !data) {
      setError("Invalid code");
      return;
    }
    if (!data.active) return setError("Code inactive");
    const now = new Date();
    if (data.starts_at && new Date(data.starts_at) > now) return setError("Code not yet active");
    if (data.expires_at && new Date(data.expires_at) < now) return setError("Code expired");
    if (data.max_uses != null && data.uses_count >= data.max_uses) return setError("Code fully redeemed");
    if (Number(data.min_order) > amount) return setError(`Minimum order ${formatINR(Number(data.min_order))}`);

    let discount = 0;
    if (data.discount_percent) discount = Math.round((amount * data.discount_percent) / 100);
    else if (data.discount_flat) discount = Math.min(Number(data.discount_flat), amount);
    if (discount <= 0) return setError("Code not applicable");

    onApplied({ id: data.id, code: data.code, discount });
    setCode("");
  };

  if (applied) {
    return (
      <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Check className="size-4 text-emerald-600" />
          <span className="font-semibold text-emerald-700">{applied.code}</span>
          <span className="text-muted-foreground">applied · −{formatINR(applied.discount)}</span>
        </div>
        <button
          type="button"
          onClick={() => onApplied(null)}
          className="size-6 rounded-full hover:bg-destructive/10 grid place-items-center text-muted-foreground hover:text-destructive"
          aria-label="Remove promo"
        >
          <X className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Promo code"
            className="pl-9 uppercase tracking-wider"
            maxLength={32}
          />
        </div>
        <Button type="button" variant="outline" onClick={apply} disabled={loading || !code.trim()}>
          {loading ? "…" : "Apply"}
        </Button>
      </div>
      {error && <div className="text-xs text-destructive mt-1.5 ml-1">{error}</div>}
    </div>
  );
}
