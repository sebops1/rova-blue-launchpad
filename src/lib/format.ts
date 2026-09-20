export function usd(value: number | null | undefined, decimals = 0) {
  const n = Number(value ?? 0);
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function sle(value: number | null | undefined, rate: number) {
  const n = Number(value ?? 0) * (rate || 0);
  return `SLE ${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function pct(value: number | null | undefined, decimals = 0) {
  return `${Number(value ?? 0).toFixed(decimals)}%`;
}

export function num(value: number | null | undefined, decimals = 0) {
  return Number(value ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function dateLabel(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function daysUntil(value: string | null | undefined) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
}

export function landedCost(item: {
  qty?: number | null;
  unit_price?: number | null;
  freight?: number | null;
  duty?: number | null;
  local_delivery?: number | null;
}) {
  const subtotal = Number(item.qty ?? 0) * Number(item.unit_price ?? 0);
  return {
    subtotal,
    landed: subtotal + Number(item.freight ?? 0) + Number(item.duty ?? 0) + Number(item.local_delivery ?? 0),
  };
}
