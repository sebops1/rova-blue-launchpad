import { createFileRoute } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { useState } from "react";

import { GlassCard, PlanningTag, SectionHeading, StatusBadge } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DEFAULT_COMPANY, DEFAULT_FINANCE, useRows, useSettings } from "@/lib/data";
import { dateLabel, num, pct, usd } from "@/lib/format";
import { landedCost } from "@/lib/format";
import { computeReadiness, phase1Capital, validatedCapital, weightedScore } from "@/lib/readiness";
import { SCORE_CRITERIA } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports — RovaX Blue Launch Command Center" },
      {
        name: "description",
        content:
          "Print-ready site comparison, site visit, investor readiness, procurement, launch status, financial and partner reports.",
      },
      { property: "og:title", content: "Reports — RovaX Blue Launch Command Center" },
      {
        property: "og:description",
        content: "Print-ready site, procurement, financial, launch status and partner reports.",
      },
    ],
  }),
  component: ReportsPage,
});

const REPORTS = [
  { value: "sites", label: "Site comparison report" },
  { value: "visit", label: "Site visit report" },
  { value: "investor", label: "Investor readiness summary" },
  { value: "procurement", label: "Procurement & landed cost" },
  { value: "launch", label: "30-day launch status" },
  { value: "finance", label: "Monthly financial scenarios" },
  { value: "partners", label: "Partner pipeline" },
] as const;

function ReportsPage() {
  const [report, setReport] = useState<string>("sites");
  const sites = useRows("sites", { column: "name" });
  const compliance = useRows("compliance_items", { column: "sort_order" });
  const procurement = useRows("procurement_items", { column: "sort_order" });
  const tasks = useRows("tasks", { column: "sort_order" });
  const leads = useRows("leads", { column: "created_at" });
  const partners = useRows("partners", { column: "name" });
  const settings = useSettings();

  const company = { ...DEFAULT_COMPANY, ...(settings.data?.company ?? {}) };
  const finance = { ...DEFAULT_FINANCE, ...(settings.data?.finance ?? {}) } as any;
  const weights = settings.data?.scoring_weights ?? {};

  const readiness = computeReadiness({
    sites: sites.data ?? [],
    compliance: compliance.data ?? [],
    procurement: procurement.data ?? [],
    tasks: tasks.data ?? [],
    leads: leads.data ?? [],
  });

  const title = REPORTS.find((r) => r.value === report)?.label ?? "Report";

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Module 12"
        title="Reports"
        description="Clean, print-ready views for meetings with partners, suppliers and investors."
        actions={
          <>
            <Select value={report} onValueChange={setReport}>
              <SelectTrigger className="w-64" aria-label="Choose report">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORTS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => window.print()}>
              <Printer className="size-4" /> Print / PDF
            </Button>
          </>
        }
      />

      <GlassCard className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/60 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{company.name}</p>
            <h2 className="mt-1 font-display text-2xl font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">{company.tagline}</p>
          </div>
          <div className="text-right text-sm">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Generated</p>
            <p>{dateLabel(new Date().toISOString())}</p>
          </div>
        </div>

        <div className="mt-5 space-y-5">
          <PlanningTag label="Planning data — figures are estimates, not commitments" />

          {report === "sites" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead className="text-right">Weighted score</TableHead>
                  <TableHead>Visited</TableHead>
                  <TableHead>Decision</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(sites.data ?? [])
                  .map((s) => ({ ...s, pctScore: weightedScore(s, weights).percent }))
                  .sort((a, b) => b.pctScore - a.pctScore)
                  .map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-muted-foreground">{s.area ?? "—"}</TableCell>
                      <TableCell className="text-right">{pct(s.pctScore)}</TableCell>
                      <TableCell className="text-muted-foreground">{dateLabel(s.visited_on)}</TableCell>
                      <TableCell>
                        <StatusBadge value={s.decision} />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          ) : null}

          {report === "visit" ? (
            <div className="space-y-6">
              {(sites.data ?? []).map((s) => (
                <div key={s.id} className="space-y-3 border-b border-border/60 pb-5 last:border-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold">{s.name}</h3>
                    <StatusBadge value={s.decision} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Visited {dateLabel(s.visited_on)} • Weighted score {pct(weightedScore(s, weights).percent)}
                  </p>
                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <Field label="Weekday observations" value={s.weekday_observations} />
                    <Field label="Weekend observations" value={s.weekend_observations} />
                    <Field label="Tide & weather" value={s.tide_weather_notes} />
                    <Field label="Access" value={s.access_notes} />
                    <Field label="GPS / location" value={s.gps_notes} />
                    <Field label="Notes" value={s.notes} />
                  </div>
                  <div className="grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2 lg:grid-cols-4">
                    {SCORE_CRITERIA.map((c) => (
                      <div key={c.key} className="flex justify-between gap-2">
                        <span className="text-muted-foreground">{c.label}</span>
                        <span>{(s.scores ?? {})[c.key] ?? "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {report === "investor" ? (
            <div className="space-y-4 text-sm">
              <p className="text-base">
                Overall launch readiness: <span className="font-semibold text-primary">{pct(readiness.score)}</span>
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Readiness component</TableHead>
                    <TableHead className="text-right">Weight</TableHead>
                    <TableHead className="text-right">Progress</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {readiness.components.map((c) => (
                    <TableRow key={c.label}>
                      <TableCell>{c.label}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{c.weight}</TableCell>
                      <TableCell className="text-right">{pct(c.progress * 100)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Phase 1 capital plan" value={usd(phase1Capital(procurement.data ?? []))} />
                <Field label="Validated by supplier quote" value={usd(validatedCapital(procurement.data ?? []))} />
                <Field label="Monthly operating expense" value={usd(finance.monthly_opex)} />
                <Field label="Variable cost" value={pct(finance.variable_pct)} />
              </div>
            </div>
          ) : null}

          {report === "procurement" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit</TableHead>
                  <TableHead className="text-right">Landed</TableHead>
                  <TableHead>Basis</TableHead>
                  <TableHead>Phase</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(procurement.data ?? []).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.item}</TableCell>
                    <TableCell className="text-muted-foreground">{p.supplier ?? "—"}</TableCell>
                    <TableCell className="text-right">{num(p.qty)}</TableCell>
                    <TableCell className="text-right">{usd(p.unit_price)}</TableCell>
                    <TableCell className="text-right">{usd(landedCost(p).landed)}</TableCell>
                    <TableCell className="text-muted-foreground">{p.price_basis}</TableCell>
                    <TableCell className="text-muted-foreground">{p.phase}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}

          {report === "launch" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(tasks.data ?? []).map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.title}</TableCell>
                    <TableCell className="text-muted-foreground">{t.category}</TableCell>
                    <TableCell className="text-muted-foreground">{t.owner ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{dateLabel(t.due_date)}</TableCell>
                    <TableCell>
                      <StatusBadge value={t.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}

          {report === "finance" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Monthly sales scenario</TableHead>
                  <TableHead className="text-right">Variable cost</TableHead>
                  <TableHead className="text-right">Contribution</TableHead>
                  <TableHead className="text-right">Operating expense</TableHead>
                  <TableHead className="text-right">Profit / loss</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(finance.scenarios ?? []).map((sales: number) => {
                  const variable = sales * (Number(finance.variable_pct) / 100);
                  const contribution = sales - variable;
                  const profit = contribution - Number(finance.monthly_opex);
                  return (
                    <TableRow key={sales}>
                      <TableCell className="font-medium">{usd(sales)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{usd(variable)}</TableCell>
                      <TableCell className="text-right">{usd(contribution)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{usd(finance.monthly_opex)}</TableCell>
                      <TableCell className={`text-right font-medium ${profit >= 0 ? "text-success" : "text-destructive"}`}>
                        {usd(profit)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : null}

          {report === "partners" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organisation</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead>Next follow-up</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(partners.data ?? []).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">{p.partner_type}</TableCell>
                    <TableCell className="text-right">{p.commission_pct == null ? "—" : pct(p.commission_pct)}</TableCell>
                    <TableCell className="text-muted-foreground">{dateLabel(p.next_follow_up)}</TableCell>
                    <TableCell>
                      <StatusBadge value={p.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
        </div>
      </GlassCard>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm">{value || "—"}</p>
    </div>
  );
}
