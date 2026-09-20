import { createFileRoute } from "@tanstack/react-router";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState, GlassCard, PlanningTag, SectionHeading, StatCard, StatusBadge } from "@/components/glass";
import { ConfirmDelete, RecordDialog, type FieldDef } from "@/components/record-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { DEFAULT_CURRENCY, useDeleteRow, useRows, useSaveRow, useSettings } from "@/lib/data";
import { num, pct, sle, usd } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/experiences")({
  head: () => ({
    meta: [
      { title: "Experiences & Pricing — RovaX Blue Launch Command Center" },
      {
        name: "description",
        content:
          "Edit launch pricing hypotheses, direct costs and gross margins for every RovaX Blue water experience and add-on.",
      },
      { property: "og:title", content: "Experiences & Pricing — RovaX Blue Launch Command Center" },
      {
        property: "og:description",
        content: "Edit launch pricing hypotheses, direct costs and gross margins for every RovaX Blue experience.",
      },
    ],
  }),
  component: ExperiencesPage,
});

const FIELDS: FieldDef[] = [
  { name: "name", label: "Experience", required: true, colSpan: 2 },
  { name: "duration_minutes", label: "Duration (minutes)", type: "number", min: 0 },
  { name: "capacity", label: "Capacity (guests)", type: "number", min: 0 },
  { name: "price", label: "Price (USD)", type: "number", min: 0, step: 1 },
  { name: "direct_cost", label: "Direct cost (USD)", type: "number", min: 0, step: 1 },
  { name: "sort_order", label: "Display order", type: "number", min: 0 },
  { name: "is_addon", label: "Add-on", type: "switch" },
  { name: "active", label: "Active", type: "switch" },
  { name: "inclusions", label: "Inclusions", type: "textarea", colSpan: 2 },
  { name: "notes", label: "Notes", type: "textarea", colSpan: 2 },
];

function margin(row: { price?: number | null; direct_cost?: number | null }) {
  const price = Number(row.price ?? 0);
  const cost = Number(row.direct_cost ?? 0);
  return { gross: price - cost, pctValue: price > 0 ? ((price - cost) / price) * 100 : 0 };
}

function ExperiencesPage() {
  const { canEdit } = useAuth();
  const experiences = useRows("experiences", { column: "sort_order" });
  const settings = useSettings();
  const save = useSaveRow("experiences", "Experience");
  const remove = useDeleteRow("experiences", "Experience");

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bundle, setBundle] = useState<string[]>([]);

  const currency = { ...DEFAULT_CURRENCY, ...(settings.data?.currency ?? {}) };
  const all = experiences.data ?? [];

  const rows = useMemo(
    () => all.filter((e) => `${e.name} ${e.inclusions ?? ""}`.toLowerCase().includes(search.toLowerCase())),
    [all, search],
  );

  const activeRows = all.filter((e) => e.active);
  const avgMargin =
    activeRows.length > 0
      ? activeRows.reduce((sum, r) => sum + margin(r).pctValue, 0) / activeRows.length
      : 0;

  const bundleRows = all.filter((e) => bundle.includes(e.id));
  const bundlePrice = bundleRows.reduce((s, r) => s + Number(r.price ?? 0), 0);
  const bundleCost = bundleRows.reduce((s, r) => s + Number(r.direct_cost ?? 0), 0);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Module 07"
        title="Experiences & Pricing"
        description="Launch prices are hypotheses to be tested with real customers, not confirmed market rates."
        actions={
          canEdit ? (
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="size-4" /> Add experience
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active experiences" value={activeRows.filter((e) => !e.is_addon).length} />
        <StatCard label="Active add-ons" value={activeRows.filter((e) => e.is_addon).length} />
        <StatCard label="Average gross margin" value={pct(avgMargin)} tone="aqua" icon={<Sparkles className="size-4" />} />
        <StatCard
          label="Exchange rate"
          value={`1 USD = ${num(currency.sle_rate)} SLE`}
          sub="Editable in Settings"
          tone="gold"
        />
      </div>

      <GlassCard className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <Input
          className="flex-1"
          placeholder="Search experiences"
          aria-label="Search experiences"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <PlanningTag label="Planning / Unvalidated pricing" />
      </GlassCard>

      {rows.length === 0 ? (
        <EmptyState title="No experiences yet" description="Add your first packaged experience to start pricing it." />
      ) : (
        <GlassCard className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {canEdit ? <TableHead className="w-10">Bundle</TableHead> : null}
                <TableHead>Experience</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">SLE</TableHead>
                <TableHead className="text-right">Direct cost</TableHead>
                <TableHead className="text-right">Gross margin</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const m = margin(row);
                return (
                  <TableRow key={row.id}>
                    {canEdit ? (
                      <TableCell>
                        <Checkbox
                          checked={bundle.includes(row.id)}
                          aria-label={`Add ${row.name} to bundle`}
                          onCheckedChange={(checked) =>
                            setBundle((prev) =>
                              checked ? [...prev, row.id] : prev.filter((id) => id !== row.id),
                            )
                          }
                        />
                      </TableCell>
                    ) : null}
                    <TableCell>
                      <p className="font-medium">{row.name}</p>
                      {row.inclusions ? (
                        <p className="mt-1 max-w-md text-xs text-muted-foreground">{row.inclusions}</p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.duration_minutes ? `${row.duration_minutes} min` : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.capacity ?? "—"}</TableCell>
                    <TableCell className="text-right font-medium">{usd(row.price)}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {sle(row.price, currency.sle_rate)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{usd(row.direct_cost)}</TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium text-primary">{usd(m.gross)}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{pct(m.pctValue)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <StatusBadge value={row.active ? "Active" : "Inactive"} tone={row.active ? "green" : "neutral"} />
                        {row.is_addon ? <StatusBadge value="Add-on" tone="gold" /> : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {canEdit ? (
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditing(row);
                              setDialogOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => setDeleteId(row.id)}>
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </GlassCard>
      )}

      {canEdit ? (
        <GlassCard className="p-5">
          <h2 className="text-lg font-semibold">Package builder</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tick experiences above to model a bundle price before you offer it.
          </p>
          {bundleRows.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No experiences selected yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              <ul className="space-y-1 text-sm">
                {bundleRows.map((r) => (
                  <li key={r.id} className="flex justify-between gap-4">
                    <span>{r.name}</span>
                    <span className="text-muted-foreground">{usd(r.price)}</span>
                  </li>
                ))}
              </ul>
              <div className="grid gap-4 border-t border-border pt-3 sm:grid-cols-4">
                <StatCard label="Bundle price" value={usd(bundlePrice)} />
                <StatCard label="Bundle direct cost" value={usd(bundleCost)} />
                <StatCard label="Bundle margin" value={usd(bundlePrice - bundleCost)} tone="aqua" />
                <StatCard
                  label="In SLE"
                  value={sle(bundlePrice, currency.sle_rate)}
                  tone="gold"
                  sub="Indicative conversion"
                />
              </div>
              <Button variant="ghost" size="sm" onClick={() => setBundle([])}>
                Clear selection
              </Button>
            </div>
          )}
        </GlassCard>
      ) : null}

      <RecordDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit experience" : "Add experience"}
        description="Prices are planning hypotheses until validated by real bookings."
        fields={FIELDS}
        value={editing}
        submitting={save.isPending}
        onSubmit={(values) => save.mutate(values, { onSuccess: () => setDialogOpen(false) })}
      />

      <ConfirmDelete
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        label="experience"
        onConfirm={() => deleteId && remove.mutate(deleteId)}
      />
    </div>
  );
}
