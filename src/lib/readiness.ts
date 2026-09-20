/* eslint-disable @typescript-eslint/no-explicit-any */
import { landedCost } from "./format";

export type ReadinessInput = {
  sites: any[];
  compliance: any[];
  procurement: any[];
  tasks: any[];
  leads: any[];
};

export function siteScored(site: any) {
  return Object.values(site?.scores ?? {}).filter((v) => Number(v) > 0).length > 0;
}

export function weightedScore(site: any, weights: Record<string, number>) {
  const scores = (site?.scores ?? {}) as Record<string, number>;
  let total = 0;
  let maxTotal = 0;
  for (const [key, weight] of Object.entries(weights)) {
    const w = Number(weight) || 0;
    maxTotal += w * 10;
    total += w * (Number(scores[key]) || 0);
  }
  if (maxTotal === 0) return { raw: 0, percent: 0 };
  return { raw: total, percent: (total / maxTotal) * 100 };
}

export function phase1Capital(items: any[]) {
  return items
    .filter((i) => Number(i.phase) === 1)
    .reduce((sum, i) => sum + landedCost(i).landed, 0);
}

export function validatedCapital(items: any[]) {
  return items
    .filter((i) => Number(i.phase) === 1 && i.price_basis === "Validated quote")
    .reduce((sum, i) => sum + landedCost(i).landed, 0);
}

export function computeReadiness({ sites, compliance, procurement, tasks, leads }: ReadinessInput) {
  const scored = sites.filter(siteScored).length;
  const siteCoverage = sites.length ? Math.min(1, scored / sites.length) : 0;
  const preferred = sites.some((s) => s.decision === "Preferred") ? 1 : 0;

  const relevant = compliance.filter((c) => c.status !== "N/A");
  const complianceProgress = relevant.length
    ? relevant.reduce((sum, c) => {
        const weights: Record<string, number> = {
          "Not Started": 0,
          "In Progress": 0.4,
          Submitted: 0.7,
          Approved: 1,
        };
        return sum + (weights[c.status] ?? 0);
      }, 0) / relevant.length
    : 0;

  const phase1 = procurement.filter((p) => Number(p.phase) === 1);
  const quoted = phase1.filter((p) => p.price_basis === "Validated quote").length;
  const quoteProgress = phase1.length ? quoted / phase1.length : 0;

  const done = tasks.filter((t) => t.status === "Done").length;
  const taskProgress = tasks.length ? done / tasks.length : 0;

  const deposits = leads.reduce((sum, l) => sum + Number(l.deposit ?? 0), 0);
  const presales = Math.min(1, deposits / 1000);

  const components = [
    { label: "Site validation", weight: 20, progress: siteCoverage },
    { label: "Preferred site selected", weight: 10, progress: preferred },
    { label: "Compliance & safety", weight: 25, progress: complianceProgress },
    { label: "Validated procurement quotes", weight: 20, progress: quoteProgress },
    { label: "Launch tasks completed", weight: 15, progress: taskProgress },
    { label: "Pre-sales traction", weight: 10, progress: presales },
  ];

  const score = components.reduce((sum, c) => sum + c.weight * c.progress, 0);

  return { score: Math.round(score), components, scored, deposits, quoted, done };
}
