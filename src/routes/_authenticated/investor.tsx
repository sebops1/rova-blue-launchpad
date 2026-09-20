import { createFileRoute } from "@tanstack/react-router";
import { Printer } from "lucide-react";

import { GlassCard, PlanningTag, SectionHeading, StatCard } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DEFAULT_COMPANY, DEFAULT_FINANCE, useRows, useSettings } from "@/lib/data";
import { dateLabel, num, pct, usd } from "@/lib/format";
import { computeReadiness, phase1Capital, validatedCapital, weightedScore } from "@/lib/readiness";

export const Route = createFileRoute("/_authenticated/investor")({
  head: () => ({
    meta: [
      { title: "Investor Summary — RovaX Blue Launch Command Center" },
      {
        name: "description",
        content:
          "Read-only readiness summary for investors and strategic partners: progress, capital plan, break-even and pilot status.",
      },
      { property: "og:title", content: "Investor Summary — RovaX Blue Launch Command Center" },
      {
        property: "og:description",
        content: "Read-only readiness summary: progress, capital plan, break-even and pilot status.",
      },
    ],
  }),
  component: InvestorPage,
});

function InvestorPage() {
  const sites = useRows("sites", { column: "name" });
  const compliance = useRows("compliance_items", { column: "sort_order" });
  const procurement = useRows("procurement_items", { column: "sort_order" });
  const tasks = useRows("tasks", { column: "sort_order" });
  const leads = useRows("leads", { column: "created_at" });
  const experiences = useRows("experiences", { column: "sort_order" });
  const settings = useSettings();

  const company = { ...DEFAULT_COMPANY, ...(settings.data?.company ?? {}) };
  const finance = { ...DEFAULT_FINANCE, ...(settings.data?.finance ?? {}) };
  const share = settings.data?.investor_share ?? {};
  const weights = settings.data?.scoring_weights ?? {};

  const readiness = computeReadiness({
    sites: sites.data ?? [],
    compliance: compliance.data ?? [],
    procurement: procurement.data ?? [],
    tasks: tasks.data ?? [],
    leads: leads.data ?? [],
  });

  const contributionPct = 100 - Number((finance as any).variable_pct ?? 0);
  const breakEvenMonthly = contributionPct > 0 ? Number(finance.monthly_opex ?? 0) / (contributionPct / 100) : 0;
  const breakEvenDaily = Number(finance.operating_days ?? 0) > 0 ? breakEvenMonthly / Number(finance.operating_days) : 0;

  const scored = (sites.data ?? [])
    .map((s) => ({ name: s.name, score: weightedScore(s, weights).percent, decision: s.decision }))
    .sort((a, b) => b.score - a.score);

  const approvals = (compliance.data ?? []).filter((c) => c.status === "Approved").length;

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Read-only"
        title="Investor & Partner Summary"
        description="Aggregated planning status only. Private operational notes, contacts and negotiations are not shown here."
        actions={
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="size-4" /> Print
          </Button>
        }
      />

      <GlassCard className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold">{company.name}</h2>
            <p className="text-sm text-muted-foreground">{company.tagline}</p>
            <p className="text-sm text-muted-foreground">{company.subtitle}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Generated</p>
            <p className="text-sm">{dateLabel(new Date().toISOString())}</p>
          </div>
        </div>
        {share.summary ? <p className="mt-4 max-w-3xl text-sm">{share.summary}</p> : null}
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm">
            <span>Overall launch readiness</span>
            <span className="font-semibold text-primary">{pct(readiness.score)}</span>
          </div>
          <Progress className="mt-2 h-2" value={readiness.score} />
        </div>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Candidate sites evaluated" value={`${readiness.scored} / ${(sites.data ?? []).length}`} />
        <StatCard label="Compliance items approved" value={`${approvals} / ${(compliance.data ?? []).length}`} />
        <StatCard label="Phase 1 capital plan" value={usd(phase1Capital(procurement.data ?? []))} tone="gold" />
        <StatCard
          label="Validated by supplier quote"
          value={usd(validatedCapital(procurement.data ?? []))}
          tone="aqua"
          sub="Remainder is reference pricing"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard className="p-6">
          <h3 className="font-semibold">Planning economics</h3>
          <PlanningTag label="Planning estimate — not a forecast or promise" />
          <div className="mt-4 space-y-2 text-sm">
            <Row label="Capital requirement" value={usd(finance.capital)} />
            <Row label="Monthly operating expense" value={usd(finance.monthly_opex)} />
            <Row label="Variable cost" value={pct(finance.variable_pct)} />
            <Row label="Contribution margin" value={pct(contributionPct)} />
            <Row label="Break-even monthly sales" value={usd(breakEvenMonthly)} />
            <Row label="Break-even daily sales" value={`${usd(breakEvenDaily)} over ${num(finance.operating_days)} days`} />
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="font-semibold">Site shortlist</h3>
          <p className="text-sm text-muted-foreground">Weighted scores from field evaluation. No site is confirmed yet.</p>
          <Table className="mt-3">
            <TableHeader>
              <TableRow>
                <TableHead>Site</TableHead>
                <TableHead className="text-right">Weighted score</TableHead>
                <TableHead>Decision</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scored.map((s) => (
                <TableRow key={s.name}>
                  <TableCell>{s.name}</TableCell>
                  <TableCell className="text-right">{`${s.score.toFixed(0)}%`}</TableCell>
                  <TableCell className="text-muted-foreground">{s.decision}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </GlassCard>
      </div>

      <GlassCard className="p-6">
        <h3 className="font-semibold">Experience line-up</h3>
        <p className="text-sm text-muted-foreground">Launch pricing hypotheses to be tested during the 90-day pilot.</p>
        <Table className="mt-3">
          <TableHeader>
            <TableRow>
              <TableHead>Experience</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead className="text-right">Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(experiences.data ?? [])
              .filter((e) => e.active)
              .map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{e.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {e.duration_minutes ? `${e.duration_minutes} min` : "—"}
                  </TableCell>
                  <TableCell className="text-right">{usd(e.price)}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </GlassCard>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
