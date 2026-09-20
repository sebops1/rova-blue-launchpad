import { createFileRoute } from "@tanstack/react-router";
import { Plus, ShieldAlert, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState, GlassCard, SectionHeading, StatCard, StatusBadge } from "@/components/glass";
import { ConfirmDelete, RecordDialog, type FieldDef } from "@/components/record-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { COMPLIANCE_STATUSES } from "@/lib/constants";
import { useDeleteRow, useRows, useSaveRow } from "@/lib/data";
import { dateLabel } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/compliance")({
  head: () => ({
    meta: [
      { title: "Compliance & Safety — RovaX Blue Launch Command Center" },
      {
        name: "description",
        content:
          "Track permissions, insurance, drone verification, rescue equipment and safety SOPs before paid operations begin.",
      },
      { property: "og:title", content: "Compliance & Safety — RovaX Blue Launch Command Center" },
      {
        property: "og:description",
        content:
          "Track permissions, insurance, drone verification, rescue equipment and safety SOPs before paid operations begin.",
      },
    ],
  }),
  component: CompliancePage,
});

const FIELDS: FieldDef[] = [
  { name: "title", label: "Requirement", required: true, colSpan: 2 },
  { name: "category", label: "Category" },
  { name: "status", label: "Status", type: "select", options: COMPLIANCE_STATUSES as unknown as string[] },
  { name: "owner", label: "Owner" },
  { name: "due_date", label: "Target date", type: "date" },
  { name: "reference", label: "Reference / authority" },
  { name: "notes", label: "Notes", type: "textarea", colSpan: 2 },
];

function CompliancePage() {
  const { canEdit } = useAuth();
  const items = useRows("compliance_items", { column: "sort_order" });
  const save = useSaveRow("compliance_items", "Requirement");
  const remove = useDeleteRow("compliance_items", "Requirement");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      (items.data ?? []).filter(
        (i) =>
          `${i.title} ${i.category ?? ""} ${i.reference ?? ""}`.toLowerCase().includes(search.toLowerCase()) &&
          (status === "all" || i.status === status),
      ),
    [items.data, search, status],
  );

  const all = items.data ?? [];
  const counts = {
    approved: all.filter((i) => i.status === "Approved").length,
    inFlight: all.filter((i) => i.status === "In Progress" || i.status === "Submitted").length,
    notStarted: all.filter((i) => i.status === "Not Started").length,
  };

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Module 04"
        title="Compliance & Safety"
        description="Nothing here is assumed to be granted. Each requirement stays Not Started until you have evidence in hand."
        actions={
          canEdit ? (
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="size-4" /> Add requirement
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Approved" value={`${counts.approved} / ${all.length}`} sub="Evidence confirmed" />
        <StatCard label="In progress or submitted" value={counts.inFlight} sub="Awaiting a decision or action" />
        <StatCard
          label="Not started"
          value={counts.notStarted}
          tone="gold"
          sub="Blockers for a safe, legal pilot"
          icon={<ShieldAlert className="size-4" />}
        />
      </div>

      <GlassCard className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            className="flex-1"
            placeholder="Search requirements"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search requirements"
          />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="sm:w-52" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {COMPLIANCE_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </GlassCard>

      {rows.length === 0 ? (
        <EmptyState title="No requirements match" description="Try a different search or status filter." />
      ) : (
        <GlassCard className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Requirement</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <p className="font-medium">{row.title}</p>
                    {row.notes ? <p className="mt-1 text-xs text-muted-foreground">{row.notes}</p> : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.category}</TableCell>
                  <TableCell className="text-muted-foreground">{row.owner ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{dateLabel(row.due_date)}</TableCell>
                  <TableCell>
                    {canEdit ? (
                      <Select
                        value={row.status}
                        onValueChange={(value) => save.mutate({ id: row.id, status: value })}
                      >
                        <SelectTrigger className="w-40" aria-label={`Status for ${row.title}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COMPLIANCE_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <StatusBadge value={row.status} />
                    )}
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
          </Table>
        </GlassCard>
      )}

      <RecordDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit requirement" : "Add requirement"}
        fields={FIELDS}
        value={editing}
        submitting={save.isPending}
        onSubmit={(values) => save.mutate(values, { onSuccess: () => setDialogOpen(false) })}
      />

      <ConfirmDelete
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        label="requirement"
        onConfirm={() => deleteId && remove.mutate(deleteId)}
      />
    </div>
  );
}
