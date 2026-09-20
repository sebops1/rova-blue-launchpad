import { createFileRoute } from "@tanstack/react-router";
import { Package, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState, GlassCard, PlanningTag, SectionHeading, StatCard, StatusBadge } from "@/components/glass";
import { ConfirmDelete, RecordDialog, type FieldDef } from "@/components/record-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { PRICE_BASIS, PRIORITIES, PROCUREMENT_STATUSES } from "@/lib/constants";
import { useDeleteRow, useRows, useSaveRow } from "@/lib/data";
import { dateLabel, landedCost, usd } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/procurement")({
  head: () => ({
    meta: [
      { title: "Procurement — RovaX Blue Launch Command Center" },
      {
        name: "description",
        content:
          "Equipment list with supplier quotes, freight, duty and landed cost, separating reference prices from validated quotes.",
      },
      { property: "og:title", content: "Procurement — RovaX Blue Launch Command Center" },
      {
        property: "og:description",
        content:
          "Equipment list with supplier quotes, freight, duty and landed cost, separating reference prices from validated quotes.",
      },
    ],
  }),
  component: ProcurementPage,
});

const FIELDS: FieldDef[] = [
  { name: "name", label: "Item", required: true, colSpan: 2 },
  { name: "category", label: "Category" },
  { name: "supplier", label: "Supplier" },
  { name: "url", label: "Supplier URL", type: "url", colSpan: 2 },
  { name: "qty", label: "Quantity", type: "number", min: 0, step: 1 },
  { name: "unit_price", label: "Unit price (USD)", type: "number", min: 0, step: 0.01 },
  { name: "freight", label: "Freight (USD)", type: "number", min: 0, step: 0.01 },
  { name: "duty", label: "Import / duty (USD)", type: "number", min: 0, step: 0.01 },
  { name: "local_delivery", label: "Local delivery (USD)", type: "number", min: 0, step: 0.01 },
  {
    name: "price_basis",
    label: "Price basis",
    type: "select",
    options: PRICE_BASIS as unknown as string[],
    help: "Reference prices are research estimates, not supplier commitments.",
  },
  { name: "status", label: "Status", type: "select", options: PROCUREMENT_STATUSES as unknown as string[] },
  { name: "priority", label: "Priority", type: "select", options: PRIORITIES as unknown as string[] },
  { name: "quote_date", label: "Quote date", type: "date" },
  { name: "quote_expiry", label: "Quote expiry", type: "date" },
  { name: "phase", label: "Phase", type: "number", min: 1, max: 2, step: 1, help: "1 = launch, 2 = later expansion" },
  { name: "notes", label: "Notes", type: "textarea", colSpan: 2 },
];

function ProcurementPage() {
  const { canEdit } = useAuth();
  const items = useRows("procurement_items", { column: "sort_order" });
  const save = useSaveRow("procurement_items", "Item");
  const remove = useDeleteRow("procurement_items", "Item");

  const [search, setSearch] = useState("");
  const [phase, setPhase] = useState("1");
  const [status, setStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      (items.data ?? [])
        .filter(
          (i) =>
            `${i.name} ${i.supplier ?? ""} ${i.category ?? ""}`.toLowerCase().includes(search.toLowerCase()) &&
            (phase === "all" || String(i.phase) === phase) &&
            (status === "all" || i.status === status),
        )
        .map((i) => ({ ...i, ...landedCost(i) })),
    [items.data, search, phase, status],
  );

  const totals = rows.reduce(
    (acc, row) => ({
      subtotal: acc.subtotal + row.subtotal,
      landed: acc.landed + row.landed,
    }),
    { subtotal: 0, landed: 0 },
  );

  const all = (items.data ?? []).map((i) => ({ ...i, ...landedCost(i) }));
  const phase1 = all.filter((i) => Number(i.phase) === 1);
  const validated = phase1.filter((i) => i.price_basis === "Validated quote");

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Module 05"
        title="Procurement & Landed Cost"
        description="Reference prices are research estimates only. Landed cost becomes reliable once each line carries a validated supplier quote."
        actions={
          <>
            <PlanningTag />
            {canEdit ? (
              <Button
                onClick={() => {
                  setEditing(null);
                  setDialogOpen(true);
                }}
              >
                <Plus className="size-4" /> Add item
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Phase 1 landed cost"
          value={usd(phase1.reduce((s, i) => s + i.landed, 0))}
          sub={`${phase1.length} launch items`}
          icon={<Package className="size-4" />}
        />
        <StatCard
          label="Validated by quote"
          value={usd(validated.reduce((s, i) => s + i.landed, 0))}
          sub={`${validated.length} of ${phase1.length} lines quoted`}
          tone="gold"
        />
        <StatCard
          label="Phase 2 (excluded)"
          value={usd(all.filter((i) => Number(i.phase) === 2).reduce((s, i) => s + i.landed, 0))}
          sub="Expansion equipment, not in launch capital"
        />
        <StatCard
          label="Freight, duty & delivery"
          value={usd(phase1.reduce((s, i) => s + i.landed - i.subtotal, 0))}
          sub="Import allowance on Phase 1"
        />
      </div>

      <GlassCard className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            className="flex-1"
            placeholder="Search items or suppliers"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search procurement items"
          />
          <Select value={phase} onValueChange={setPhase}>
            <SelectTrigger className="sm:w-40" aria-label="Filter by phase">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All phases</SelectItem>
              <SelectItem value="1">Phase 1</SelectItem>
              <SelectItem value="2">Phase 2</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="sm:w-48" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {PROCUREMENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </GlassCard>

      {rows.length === 0 ? (
        <EmptyState title="No items match" description="Adjust the filters or add a new equipment line." />
      ) : (
        <GlassCard className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="text-right">Landed</TableHead>
                <TableHead>Basis</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Quote</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <p className="font-medium">{row.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.category} · Phase {row.phase}
                    </p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.supplier ?? "—"}</TableCell>
                  <TableCell className="text-right">{row.qty}</TableCell>
                  <TableCell className="text-right">{usd(row.unit_price, 2)}</TableCell>
                  <TableCell className="text-right">{usd(row.subtotal)}</TableCell>
                  <TableCell className="text-right font-medium">{usd(row.landed)}</TableCell>
                  <TableCell>
                    <StatusBadge
                      value={row.price_basis}
                      tone={row.price_basis === "Validated quote" ? "green" : "amber"}
                    />
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={row.status} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {row.quote_date ? `${dateLabel(row.quote_date)} → ${dateLabel(row.quote_expiry)}` : "—"}
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
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4}>Totals shown</TableCell>
                <TableCell className="text-right">{usd(totals.subtotal)}</TableCell>
                <TableCell className="text-right font-semibold">{usd(totals.landed)}</TableCell>
                <TableCell colSpan={4} />
              </TableRow>
            </TableFooter>
          </Table>
        </GlassCard>
      )}

      <RecordDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit item" : "Add item"}
        description="Landed cost is calculated as (qty × unit price) + freight + duty + local delivery."
        fields={FIELDS}
        value={editing}
        submitting={save.isPending}
        onSubmit={(values) => {
          const { subtotal: _s, landed: _l, ...rest } = values as Record<string, unknown>;
          save.mutate(rest, { onSuccess: () => setDialogOpen(false) });
        }}
      />

      <ConfirmDelete
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        label="item"
        onConfirm={() => deleteId && remove.mutate(deleteId)}
      />
    </div>
  );
}
