import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function GlassCard({
  children,
  className,
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div className={cn("glass print-plain rounded-2xl", hover && "glass-hover", className)}>{children}</div>
  );
}

export function SectionHeading({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2 no-print">{actions}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "gold" | "aqua";
}) {
  return (
    <GlassCard hover className="p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        {icon ? (
          <span
            className={cn(
              "flex size-9 items-center justify-center rounded-xl",
              tone === "gold" ? "bg-gold/15 text-gold" : "bg-primary/15 text-primary",
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <p
        className={cn(
          "mt-3 text-2xl font-semibold tracking-tight",
          tone === "gold" && "text-gold",
          tone === "aqua" && "text-primary",
        )}
      >
        {value}
      </p>
      {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
    </GlassCard>
  );
}

const TONES: Record<string, string> = {
  neutral: "bg-muted text-muted-foreground border-transparent",
  aqua: "bg-primary/15 text-primary border-primary/30",
  gold: "bg-gold/15 text-gold border-gold/30",
  green: "bg-success/15 text-success border-success/30",
  amber: "bg-warning/15 text-warning border-warning/30",
  red: "bg-destructive/15 text-destructive border-destructive/30",
};

const STATUS_TONE: Record<string, keyof typeof TONES> = {
  Approved: "green",
  Confirmed: "green",
  Completed: "green",
  Agreed: "green",
  Done: "green",
  Preferred: "gold",
  "Deposit Paid": "gold",
  Received: "green",
  Ordered: "aqua",
  Submitted: "aqua",
  "In Progress": "aqua",
  "In Discussion": "aqua",
  "Quote Received": "aqua",
  "Quote Sent": "aqua",
  Contacted: "aqua",
  "This Week": "amber",
  Waiting: "amber",
  Hold: "amber",
  "Quote Requested": "amber",
  Shortlist: "aqua",
  Prospect: "neutral",
  Planned: "neutral",
  "Not Started": "neutral",
  Backlog: "neutral",
  "New Lead": "aqua",
  "Inbound Enquiry": "gold",
  "N/A": "neutral",
  Reject: "red",
  Cancelled: "red",
  Declined: "red",
  High: "red",
  Medium: "amber",
  Low: "neutral",
};

export function StatusBadge({ value, tone }: { value: string; tone?: keyof typeof TONES }) {
  const resolved = tone ?? STATUS_TONE[value] ?? "neutral";
  return (
    <Badge variant="outline" className={cn("rounded-full font-medium", TONES[resolved])}>
      {value}
    </Badge>
  );
}

export function PlanningTag({ label = "Planning / Unvalidated" }: { label?: string }) {
  return (
    <Badge variant="outline" className="rounded-full border-gold/30 bg-gold/10 text-[11px] font-medium text-gold">
      {label}
    </Badge>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 px-6 py-14 text-center">
      <p className="text-base font-medium">{title}</p>
      {description ? <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
