import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  MapPinned,
  Package,
  ShieldCheck,
  Timer,
  TrendingUp,
} from "lucide-react";

import { EmptyState, GlassCard, PlanningTag, SectionHeading, StatCard, StatusBadge } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_FINANCE, useRows, useSettings } from "@/lib/data";
import { LAUNCH_TIMELINE } from "@/lib/constants";
import { dateLabel, daysUntil, num, usd } from "@/lib/format";
import { computeReadiness, phase1Capital, validatedCapital, weightedScore } from "@/lib/readiness";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Executive Dashboard — RovaX Blue Launch Command Center" },
      {
        name: "description",
        content: "Launch readiness score, key metrics, 30-day timeline, risks and next actions for RovaX Blue.",
      },
      { property: "og:title", content: "Executive Dashboard — RovaX Blue Launch Command Center" },
      {
        property: "og:description",
        content: "Launch readiness score, key metrics, 30-day timeline, risks and next actions for RovaX Blue.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const sites = useRows("sites", { column: "name" });
  const compliance = useRows("compliance_items", { column: "sort_order" });
  const procurement = useRows("procurement_items", { column: "sort_order" });
  const tasks = useRows("tasks", { column: "sort_order" });
  const leads = useRows("leads", { column: "created_at", ascending: false });
  const settings = useSettings();

  const loading =
    sites.isLoading || compliance.isLoading || procurement.isLoading || tasks.isLoading || leads.isLoading;

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  const siteRows = sites.data ?? [];
  const complianceRows = compliance.data ?? [];
  const procurementRows = procurement.data ?? [];
  const taskRows = tasks.data ?? [];
  const leadRows = leads.data ?? [];

  const finance = { ...DEFAULT_FINANCE, ...(settings.data?.finance ?? {}) };
  const company = settings.data?.company ?? {};
  const weights = (settings.data?.scoring_weights ?? {}) as Record<string, number>;

  const readiness = computeReadiness({
    sites: siteRows,
    compliance: complianceRows,
    procurement: procurementRows,
    tasks: taskRows,
    leads: leadRows,
  });

  const preferred = siteRows.find((s) => s.decision === "Preferred");
  const ranked = [...siteRows]
    .map((s) => ({ site: s, score: weightedScore(s, weights).percent }))
    .sort((a, b) => b.score - a.score);

  const permission = complianceRows.find((c) => c.title?.toLowerCase().includes("site authorization"));
  const quotesReceived = procurementRows.filter(
    (p) => p.price_basis === "Validated quote" || p.status === "Quote Received",
  ).length;

  const capitalPlanning = phase1Capital(procurementRows);
  const capitalValidated = validatedCapital(procurementRows);

  const contributionMargin = 1 - Number(finance.variable_pct ?? 20) / 100;
  const breakEvenMonthly = contributionMargin > 0 ? Number(finance.monthly_opex ?? 0) / contributionMargin : 0;
  const breakEvenDaily = Number(finance.operating_days ?? 20) > 0 ? breakEvenMonthly / Number(finance.operating_days) : 0;

  const countdown = daysUntil(company.launch_date);
  const doneTasks = taskRows.filter((t) => t.status === "Done").length;

  const risks = buildRisks({
    siteRows,
    complianceRows,
    procurementRows,
    preferred,
    capitalValidated,
    leadRows,
  });

  const nextActions = taskRows
    .filter((t) => t.status === "This Week" || t.status === "In Progress")
    .slice(0, 6);

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="RovaX Blue"
        title="Executive Dashboard"
        description="Live view of launch readiness across site validation, negotiation, procurement, compliance and pre-sales. All figures are planning estimates until validated."
        actions={<PlanningTag />}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <GlassCard className="p-6 lg:col-span-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Overall launch readiness
          </p>
          <div className="mt-4 flex items-end gap-3">
            <span className="text-5xl font-semibold text-gradient-aqua">{readiness.score}</span>
            <span className="pb-2 text-sm text-muted-foreground">/ 100</span>
          </div>
          <Progress value={readiness.score} className="mt-4" />
          <div className="mt-5 space-y-3">
            {readiness.components.map((c) => (
              <div key={c.label}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{c.label}</span>
                  <span className="font-medium">{Math.round(c.progress * 100)}%</span>
                </div>
                <Progress value={c.progress * 100} className="mt-1 h-1.5" />
              </div>
            ))}
          </div>
        </GlassCard>

        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          <StatCard
            label="Sites evaluated"
            value={`${readiness.scored} / ${siteRows.length}`}
            sub="Candidate beaches with recorded scores"
            icon={<MapPinned className="size-4" />}
          />
          <StatCard
            label="Preferred site"
            value={preferred?.name ?? "Not decided"}
            sub={
              preferred
                ? "Marked Preferred in Site Evaluation"
                : ranked[0]?.score
                  ? `Leading on score: ${ranked[0].site.name}`
                  : "Complete site scoring to compare"
            }
            tone="gold"
            icon={<CheckCircle2 className="size-4" />}
          />
          <StatCard
            label="Permission status"
            value={permission?.status ?? "Not Started"}
            sub="Site authorization / operating permission"
            icon={<ShieldCheck className="size-4" />}
          />
          <StatCard
            label="Supplier quotes received"
            value={`${quotesReceived} / ${procurementRows.length}`}
            sub="Reference prices replaced by real quotes"
            icon={<Package className="size-4" />}
          />
          <StatCard
            label="Validated equipment cost"
            value={usd(capitalValidated)}
            sub={`Planning total ${usd(capitalPlanning)} (Phase 1)`}
            icon={<CircleDollarSign className="size-4" />}
          />
          <StatCard
            label="Projected monthly break-even"
            value={usd(breakEvenMonthly)}
            sub={`${usd(breakEvenDaily)} per operating day — planning estimate`}
            icon={<TrendingUp className="size-4" />}
          />
          <StatCard
            label="Launch countdown"
            value={countdown === null ? "Set date" : `${countdown} days`}
            sub={company.launch_date ? dateLabel(company.launch_date) : "Add a target launch date in Settings"}
            tone="gold"
            icon={<Timer className="size-4" />}
          />
          <StatCard
            label="Tasks completed"
            value={`${doneTasks} / ${taskRows.length}`}
            sub={`${num(taskRows.length ? (doneTasks / taskRows.length) * 100 : 0)}% of the 30-day board`}
            icon={<ClipboardList className="size-4" />}
          />
        </div>
      </div>

      <GlassCard className="p-6">
        <div className="flex items-center gap-2">
          <CalendarClock className="size-4 text-primary" />
          <h2 className="text-lg font-semibold">30-day launch timeline</h2>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-5">
          {LAUNCH_TIMELINE.map((phase) => {
            const phaseTasks = taskRows.filter((t) => Number(t.week) === phase.week);
            const phaseDone = phaseTasks.filter((t) => t.status === "Done").length;
            const progress = phaseTasks.length ? (phaseDone / phaseTasks.length) * 100 : 0;
            return (
              <div key={phase.title} className="rounded-xl border border-border/70 bg-secondary/30 p-4">
                <p className="text-sm font-semibold">{phase.title}</p>
                <p className="mt-2 text-xs text-muted-foreground">{phase.detail}</p>
                <Progress value={progress} className="mt-4 h-1.5" />
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {phaseDone}/{phaseTasks.length} tasks complete
                </p>
              </div>
            );
          })}
        </div>
      </GlassCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <GlassCard className="p-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-warning" />
            <h2 className="text-lg font-semibold">Risks & open issues</h2>
          </div>
          <div className="mt-4 space-y-3">
            {risks.length === 0 ? (
              <EmptyState title="No open risks flagged" description="Risks appear automatically as gaps are detected." />
            ) : (
              risks.map((risk) => (
                <div key={risk.title} className="rounded-xl border border-border/70 bg-secondary/30 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium">{risk.title}</p>
                    <StatusBadge value={risk.severity} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{risk.detail}</p>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ClipboardList className="size-4 text-primary" />
              <h2 className="text-lg font-semibold">Next actions</h2>
            </div>
            <Button asChild variant="ghost" size="sm" className="no-print">
              <Link to="/tasks">Open board</Link>
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {nextActions.length === 0 ? (
              <EmptyState
                title="Nothing in flight"
                description="Move tasks into This Week or In Progress on the launch board."
                action={
                  <Button asChild size="sm">
                    <Link to="/tasks">Go to launch board</Link>
                  </Button>
                }
              />
            ) : (
              nextActions.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-border/70 bg-secondary/30 p-4"
                >
                  <div>
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {task.category} · {task.owner ?? "Unassigned"} · Due {dateLabel(task.due_date)}
                    </p>
                  </div>
                  <StatusBadge value={task.priority} />
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function buildRisks({
  siteRows,
  complianceRows,
  procurementRows,
  preferred,
  capitalValidated,
  leadRows,
}: {
  siteRows: any[];
  complianceRows: any[];
  procurementRows: any[];
  preferred: any;
  capitalValidated: number;
  leadRows: any[];
}) {
  const risks: { title: string; detail: string; severity: string }[] = [];

  const unscored = siteRows.filter(
    (s) => Object.values(s.scores ?? {}).filter((v) => Number(v) > 0).length === 0,
  );
  if (unscored.length > 0) {
    risks.push({
      title: `${unscored.length} candidate site(s) not yet scored`,
      detail: `Outstanding: ${unscored.map((s) => s.name).join(", ")}.`,
      severity: "High",
    });
  }
  if (!preferred) {
    risks.push({
      title: "No preferred site selected",
      detail: "Negotiation, procurement logistics and pre-sales all depend on the site decision.",
      severity: "High",
    });
  }
  const drone = complianceRows.find((c) => c.title?.toLowerCase().includes("drone"));
  if (drone && drone.status !== "Approved" && drone.status !== "N/A") {
    risks.push({
      title: "Commercial drone requirements not verified",
      detail: "Verify requirements with SLCAA before marketing any drone-captured content package.",
      severity: "High",
    });
  }
  const insurance = complianceRows.find((c) => c.title?.toLowerCase().includes("insurance"));
  if (insurance && (insurance.status === "Not Started" || insurance.status === "In Progress")) {
    risks.push({
      title: "Insurance not yet in place",
      detail: "Public liability and equipment cover should be confirmed before paid operations.",
      severity: "High",
    });
  }
  if (capitalValidated === 0 && procurementRows.length > 0) {
    risks.push({
      title: "Capital plan is based on reference prices only",
      detail: "No supplier quote has been validated yet, so landed cost remains an estimate.",
      severity: "Medium",
    });
  }
  if (leadRows.length === 0) {
    risks.push({
      title: "No demand evidence captured",
      detail: "Pre-sales and waitlist signups are the strongest validation signal before Go/No-Go.",
      severity: "Medium",
    });
  }
  return risks;
}
