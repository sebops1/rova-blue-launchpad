import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { GlassCard, PlanningTag, SectionHeading, StatCard } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { DEFAULT_FINANCE, useRows, useSaveRow, useSaveSetting, useSettings } from "@/lib/data";
import { num, usd } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/finance")({
  head: () => ({
    meta: [
      { title: "Financial Model — RovaX Blue Launch Command Center" },
      {
        name: "description",
        content:
          "Editable break-even model, revenue scenarios and a 12-month cash-flow forecast. Planning estimates only, not guaranteed returns.",
      },
      { property: "og:title", content: "Financial Model — RovaX Blue Launch Command Center" },
      {
        property: "og:description",
        content:
          "Editable break-even model, revenue scenarios and a 12-month cash-flow forecast. Planning estimates only, not guaranteed returns.",
      },
    ],
  }),
  component: FinancePage,
});

function FinancePage() {
  const { canEdit } = useAuth();
  const settings = useSettings();
  const saveSetting = useSaveSetting();
  const months = useRows("cashflow_months", { column: "month_index" });
  const saveMonth = useSaveRow("cashflow_months", "Month");
  const experiences = useRows("experiences", { column: "sort_order" });

  const stored = { ...DEFAULT_FINANCE, ...(settings.data?.["finance"] ?? {}) };
  const [draft, setDraft] = useState<Record<string, number> | null>(null);
  const finance = { ...stored, ...(draft ?? {}) };

  const [customersPerDay, setCustomersPerDay] = useState(6);
  const [averageSpend, setAverageSpend] = useState(70);

  const variableRate = Number(finance.variable_pct) / 100;
  const contributionRate = 1 - variableRate;
  const breakEvenMonthly = contributionRate > 0 ? Number(finance.monthly_opex) / contributionRate : 0;
  const breakEvenDaily = Number(finance.operating_days) > 0 ? breakEvenMonthly / Number(finance.operating_days) : 0;

  const scenarios = (finance.scenarios as number[]).map((sales) => {
    const variable = sales * variableRate;
    const contribution = sales - variable;
    const profit = contribution - Number(finance.monthly_opex);
    return {
      sales,
      variable,
      contribution,
      profit,
      recovery: profit > 0 ? Number(finance.capital) / profit : null,
    };
  });

  const builderSales = customersPerDay * averageSpend * Number(finance.operating_days);
  const builderProfit = builderSales * contributionRate - Number(finance.monthly_opex);

  const cashflow = useMemo(() => {
    let cash = Number(finance.opening_cash ?? 0);
    return (months.data ?? []).map((m) => {
      const opening = cash;
      const revenue = Number(m.revenue ?? 0);
      const variable = revenue * (Number(m.variable_cost_pct ?? finance.variable_pct) / 100);
      const opex = Number(m.operating_expense ?? 0);
      const capex = Number(m.capex ?? 0);
      const net = revenue - variable - opex - capex;
      cash = opening + net;
      return { ...m, opening, revenue, variable, opex, capex, net, closing: cash };
    });
  }, [months.data, finance.opening_cash, finance.variable_pct]);

  const activeExperiences = (experiences.data ?? []).filter((e) => e.active && !e.is_addon);

  const set = (key: string, value: number) => setDraft({ ...(draft ?? {}), [key]: value });

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Module 06"
        title="Financial Model"
        description="Every figure below is an editable planning assumption. These are scenarios for decision-making — not forecasts, promises or guaranteed returns."
        actions={<PlanningTag label="Planning estimates — not guaranteed" />}
      />

      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold">Assumptions</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AssumptionInput
            label="Launch capital (USD)"
            value={finance.capital}
            disabled={!canEdit}
            onChange={(v) => set("capital", v)}
          />
          <AssumptionInput
            label="Monthly operating expense (USD)"
            value={finance.monthly_opex}
            disabled={!canEdit}
            onChange={(v) => set("monthly_opex", v)}
          />
          <AssumptionInput
            label="Variable cost (% of sales)"
            value={finance.variable_pct}
            disabled={!canEdit}
            onChange={(v) => set("variable_pct", v)}
          />
          <AssumptionInput
            label="Operating days per month"
            value={finance.operating_days}
            disabled={!canEdit}
            onChange={(v) => set("operating_days", v)}
          />
        </div>
        {canEdit && draft ? (
          <Button
            className="mt-4"
            disabled={saveSetting.isPending}
            onClick={() =>
              saveSetting.mutate(
                { key: "finance", value: { ...stored, ...draft } },
                { onSuccess: () => setDraft(null) },
              )
            }
          >
            Save assumptions
          </Button>
        ) : null}
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Contribution margin" value={`${num(contributionRate * 100, 0)}%`} sub="After variable costs" />
        <StatCard label="Break-even monthly sales" value={usd(breakEvenMonthly)} tone="gold" sub="To cover fixed operating cost" />
        <StatCard label="Break-even daily sales" value={usd(breakEvenDaily)} sub={`Across ${finance.operating_days} operating days`} />
        <StatCard label="Launch capital" value={usd(finance.capital)} sub="Recovered from operating profit" />
      </div>

      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold">Monthly sales scenarios</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Illustrative outcomes at different monthly sales levels. Capital recovery assumes profit is fully retained.
        </p>
        <div className="mt-5 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Monthly sales</TableHead>
                <TableHead className="text-right">Variable cost</TableHead>
                <TableHead className="text-right">Contribution</TableHead>
                <TableHead className="text-right">Operating profit / loss</TableHead>
                <TableHead className="text-right">Capital recovery</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scenarios.map((s) => (
                <TableRow key={s.sales}>
                  <TableCell className="font-medium">{usd(s.sales)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{usd(s.variable)}</TableCell>
                  <TableCell className="text-right">{usd(s.contribution)}</TableCell>
                  <TableCell className={cn("text-right font-medium", s.profit >= 0 ? "text-success" : "text-destructive")}>
                    {usd(s.profit)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {s.recovery ? `${num(s.recovery, 1)} months` : "Not recovered"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scenarios}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="sales" tickFormatter={(v) => usd(v)} stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis tickFormatter={(v) => usd(v)} stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip formatter={(v: number) => usd(v)} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
              <Legend />
              <Bar dataKey="contribution" name="Contribution" fill="var(--aqua)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="profit" name="Operating profit" fill="var(--gold)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold">Scenario builder</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <AssumptionInput label="Customers per operating day" value={customersPerDay} onChange={setCustomersPerDay} />
          <AssumptionInput label="Average spend per customer (USD)" value={averageSpend} onChange={setAverageSpend} />
          <div className="rounded-xl border border-border/70 bg-secondary/30 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Implied monthly sales</p>
            <p className="mt-1 text-xl font-semibold">{usd(builderSales)}</p>
            <p className={cn("mt-1 text-sm", builderProfit >= 0 ? "text-success" : "text-destructive")}>
              {usd(builderProfit)} operating profit / loss
            </p>
          </div>
        </div>
        {activeExperiences.length > 0 ? (
          <p className="mt-4 text-xs text-muted-foreground">
            Current active package prices for reference:{" "}
            {activeExperiences.map((e) => `${e.name} ${usd(e.price)}`).join(" · ")}
          </p>
        ) : null}
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold">12-month cash-flow forecast</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Edit revenue, operating expense and capex per month. Opening and closing cash roll forward automatically.
        </p>
        <div className="mt-5 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Opening cash</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Variable cost</TableHead>
                <TableHead className="text-right">Operating expense</TableHead>
                <TableHead className="text-right">Capex</TableHead>
                <TableHead className="text-right">Net cash flow</TableHead>
                <TableHead className="text-right">Closing cash</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cashflow.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.label}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{usd(row.opening)}</TableCell>
                  <TableCell className="text-right">
                    <CellInput
                      value={row.revenue}
                      disabled={!canEdit}
                      label={`Revenue ${row.label}`}
                      onCommit={(v) => saveMonth.mutate({ id: row.id, revenue: v })}
                    />
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{usd(row.variable)}</TableCell>
                  <TableCell className="text-right">
                    <CellInput
                      value={row.opex}
                      disabled={!canEdit}
                      label={`Operating expense ${row.label}`}
                      onCommit={(v) => saveMonth.mutate({ id: row.id, operating_expense: v })}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <CellInput
                      value={row.capex}
                      disabled={!canEdit}
                      label={`Capex ${row.label}`}
                      onCommit={(v) => saveMonth.mutate({ id: row.id, capex: v })}
                    />
                  </TableCell>
                  <TableCell className={cn("text-right", row.net >= 0 ? "text-success" : "text-destructive")}>
                    {usd(row.net)}
                  </TableCell>
                  <TableCell className="text-right font-medium">{usd(row.closing)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="h-64">
            <p className="mb-2 text-sm font-medium">Revenue & net cash flow</p>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cashflow}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis tickFormatter={(v) => usd(v)} stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip formatter={(v: number) => usd(v)} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
                <Legend />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="var(--aqua)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="net" name="Net cash flow" stroke="var(--gold)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="h-64">
            <p className="mb-2 text-sm font-medium">Closing cash balance</p>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashflow}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis tickFormatter={(v) => usd(v)} stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip formatter={(v: number) => usd(v)} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
                <Area type="monotone" dataKey="closing" name="Closing cash" stroke="var(--aqua)" fill="var(--aqua)" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

function AssumptionInput({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  const id = `assumption-${label.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={0}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function CellInput({
  value,
  onCommit,
  disabled,
  label,
}: {
  value: number;
  onCommit: (value: number) => void;
  disabled?: boolean;
  label: string;
}) {
  const [local, setLocal] = useState<string | null>(null);
  if (disabled) return <span>{usd(value)}</span>;
  return (
    <Input
      aria-label={label}
      type="number"
      min={0}
      className="ml-auto h-8 w-28 text-right"
      value={local ?? value}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        if (local !== null && Number(local) !== value) onCommit(Number(local));
        setLocal(null);
      }}
    />
  );
}
