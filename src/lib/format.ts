export function formatINR(n: number | null | undefined): string {
  if (n == null) return "₹0";
  return "₹" + Number(n).toLocaleString("en-IN");
}

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function statusColor(status: string): string {
  switch (status) {
    case "confirmed":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/30";
    case "pending":
      return "bg-amber-500/10 text-amber-600 border-amber-500/30";
    case "completed":
      return "bg-primary/10 text-primary border-primary/30";
    case "cancelled":
      return "bg-destructive/10 text-destructive border-destructive/30";
    case "rescheduled":
      return "bg-sky-500/10 text-sky-600 border-sky-500/30";
    case "paid":
    case "advance_paid":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/30";
    case "unpaid":
      return "bg-amber-500/10 text-amber-600 border-amber-500/30";
    case "refunded":
      return "bg-muted text-foreground/70 border-border";
    default:
      return "bg-muted text-foreground/70 border-border";
  }
}
