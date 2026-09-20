import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2, Wallet } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState, GlassCard, SectionHeading, StatCard, StatusBadge } from "@/components/glass";
import { ConfirmDelete, RecordDialog, type FieldDef } from "@/components/record-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { LEAD_SOURCES, LEAD_STATUSES } from "@/lib/constants";
import { useDeleteRow, useRows, useSaveRow } from "@/lib/data";
import { dateLabel, usd } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/pipeline")({
  head: () => ({
    meta: [
      { title: "Pre-Sales Pipeline — RovaX Blue Launch Command Center" },
      {
        name: "description",
        content:
          "Track waitlist leads, quotes, deposits and launch-weekend bookings from first enquiry to completed experience.",
      },
      { property: "og:title", content: "Pre-Sales Pipeline — RovaX Blue Launch Command Center" },
      {
        property: "og:description",
        content: "Track waitlist leads, quotes, deposits and launch-weekend bookings for the RovaX Blue pilot.",
      },
    ],
  }),
  component: PipelinePage,
});

function PipelinePage() {
  const { canEdit } = useAuth();
  const leads = useRows("leads", { column: "created_at", ascending: false });
  const experiences = useRows("experiences", { column: "sort_order" });
  const save = useSaveRow("leads", "Lead");
  const remove = useDeleteRow("leads", "Lead");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [source, setSource] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fields: FieldDef[] = useMemo(
    () => [
      { name: "name", label: "Lead name", required: true },
      { name: "status", label: "Status", type: "select", options: LEAD_STATUSES as unknown as string[] },
      { name: "phone", label: "Phone / WhatsApp", type: "tel" },
      { name: "email", label: "Email", type: "email" },
      { name: "source", label: "Source", type: "select", options: LEAD_SOURCES as unknown as string[] },
      {
        name: "experience_id",
        label: "Experience",
        type: "select",
        options: (experiences.data ?? []).map((e) => ({ value: e.id, label: e.name })),
      },
      { name: "desired_package", label: "Desired package (free text)" },
      { name: "desired_date", label: "Desired date", type: "date" },
      { name: "party_size", label: "Party size", type: "number", min: 1 },
      { name: "quoted_price", label: "Quoted price (USD)", type: "number", min: 0 },
      { name: "deposit", label: "Deposit paid (USD)", type: "number", min: 0 },
      { name: "message", label: "Enquiry message", type: "textarea", colSpan: 2 },
      { name: "notes", label: "Internal notes", type: "textarea", colSpan: 2 },
    ],
    [experiences.data],
  );

  const all = leads.data ?? [];
  const rows = useMemo(
    () =>
      all.filter(
        (l) =>
          `${l.name} ${l.phone ?? ""} ${l.email ?? ""} ${l.desired_package ?? ""}`
            .toLowerCase()
            .includes(search.toLowerCase()) &&
          (status === "all" || l.status === status) &&
          (source === "all" || l.source === source),
      ),
    [all, search, status, source],
  );

  const open = all.filter((l) => l.status !== "Cancelled" && l.status !== "Completed");
  const pipelineValue = open.reduce((s, l) => s + Number(l.quoted_price ?? 0), 0);
  const deposits = all.reduce((s, l) => s + Number(l.deposit ?? 0), 0);
  const confirmed = all.filter((l) => ["Deposit Paid", "Confirmed", "Completed"].includes(l.status));
  const withDate = confirmed.filter((l) => Boolean(l.desired_date));

  const experienceName = (id: string | null) => (experiences.data ?? []).find((e) => e.id === id)?.name;

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Module 08"
        title="Pre-Sales & Booking Pipeline"
        description="Every lead here is a real person you have spoken to or who submitted the waitlist form. Nothing is pre-filled."
        actions={
          canEdit ? (
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="size-4" /> Add lead
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Open leads" value={open.length} sub={`${all.length} total records`} />
        <StatCard label="Pipeline value" value={usd(pipelineValue)} tone="aqua" sub="Quoted, not yet completed" />
        <StatCard label="Deposits collected" value={usd(deposits)} tone="gold" icon={<Wallet className="size-4" />} />
        <StatCard label="Bookings with a date" value={withDate.length} sub="Deposit paid or confirmed" />
      </div>

      <GlassCard className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <Input
            className="flex-1"
            placeholder="Search leads by name, phone or email"
            aria-label="Search leads"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="lg:w-48" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {LEAD_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="lg:w-48" aria-label="Filter by source">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              {LEAD_SOURCES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </GlassCard>

      {rows.length === 0 ? (
        <EmptyState
          title="No leads yet"
          description="Leads appear here as you add them or as visitors submit the public waitlist form."
        />
      ) : (
        <GlassCard className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Party</TableHead>
                <TableHead className="text-right">Quoted</TableHead>
                <TableHead className="text-right">Deposit</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <p className="font-medium">{row.name}</p>
                    {row.message ? (
                      <p className="mt-1 max-w-xs text-xs text-muted-foreground">{row.message}</p>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <p>{row.phone ?? "—"}</p>
                    <p>{row.email ?? ""}</p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.source}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {experienceName(row.experience_id) ?? row.desired_package ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{dateLabel(row.desired_date)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{row.party_size ?? "—"}</TableCell>
                  <TableCell className="text-right">{usd(row.quoted_price)}</TableCell>
                  <TableCell className="text-right text-gold">{usd(row.deposit)}</TableCell>
                  <TableCell className="text-right">
                    {usd(Number(row.quoted_price ?? 0) - Number(row.deposit ?? 0))}
                  </TableCell>
                  <TableCell>
                    {canEdit ? (
                      <Select value={row.status} onValueChange={(value) => save.mutate({ id: row.id, status: value })}>
                        <SelectTrigger className="w-36" aria-label={`Status for ${row.name}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LEAD_STATUSES.map((s) => (
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
        title={editing ? "Edit lead" : "Add lead"}
        fields={fields}
        value={editing}
        submitting={save.isPending}
        onSubmit={(values) => save.mutate(values, { onSuccess: () => setDialogOpen(false) })}
      />

      <ConfirmDelete
        open={Boolean(deleteId)}
        onOpenChange={(o) => !o && setDeleteId(null)}
        label="lead"
        onConfirm={() => deleteId && remove.mutate(deleteId)}
      />
    </div>
  );
}
