import { createFileRoute } from "@tanstack/react-router";
import { Handshake, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState, GlassCard, SectionHeading, StatCard, StatusBadge } from "@/components/glass";
import { ConfirmDelete, RecordDialog, type FieldDef } from "@/components/record-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { PARTNER_STATUSES, PARTNER_TYPES } from "@/lib/constants";
import { useDeleteRow, useRows, useSaveRow } from "@/lib/data";
import { dateLabel, pct } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/partners")({
  head: () => ({
    meta: [
      { title: "Partner Network — RovaX Blue Launch Command Center" },
      {
        name: "description",
        content:
          "Build the hotel, tour operator, wedding planner and creator network that will feed bookings into the RovaX Blue pilot.",
      },
      { property: "og:title", content: "Partner Network — RovaX Blue Launch Command Center" },
      {
        property: "og:description",
        content: "Hotels, tour operators, planners and creators feeding bookings into the RovaX Blue pilot.",
      },
    ],
  }),
  component: PartnersPage,
});

const FIELDS: FieldDef[] = [
  { name: "name", label: "Organisation", required: true },
  { name: "partner_type", label: "Partner type", type: "select", options: PARTNER_TYPES as unknown as string[] },
  { name: "contact_name", label: "Contact person" },
  { name: "status", label: "Status", type: "select", options: PARTNER_STATUSES as unknown as string[] },
  { name: "phone", label: "Phone / WhatsApp", type: "tel" },
  { name: "email", label: "Email", type: "email" },
  { name: "commission_pct", label: "Commission / revenue share (%)", type: "number", min: 0, max: 100, step: 1 },
  { name: "next_follow_up", label: "Next follow-up", type: "date" },
  { name: "message", label: "Their enquiry message", type: "textarea", colSpan: 2 },
  { name: "notes", label: "Internal notes", type: "textarea", colSpan: 2 },
];

function PartnersPage() {
  const { canEdit } = useAuth();
  const partners = useRows("partners", { column: "created_at", ascending: false });
  const save = useSaveRow("partners", "Partner");
  const remove = useDeleteRow("partners", "Partner");

  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const all = partners.data ?? [];
  const rows = useMemo(
    () =>
      all.filter(
        (p) =>
          `${p.name} ${p.contact_name ?? ""} ${p.email ?? ""}`.toLowerCase().includes(search.toLowerCase()) &&
          (type === "all" || p.partner_type === type) &&
          (status === "all" || p.status === status),
      ),
    [all, search, type, status],
  );

  const agreed = all.filter((p) => p.status === "Agreed").length;
  const active = all.filter((p) => ["Contacted", "In Discussion"].includes(p.status)).length;
  const inbound = all.filter((p) => p.status === "Inbound Enquiry").length;

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Module 09"
        title="Partner Network"
        description="Hotels, hosts, operators, planners and creators. Nothing counts as agreed until terms are written down."
        actions={
          canEdit ? (
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="size-4" /> Add partner
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Partners tracked" value={all.length} />
        <StatCard label="In conversation" value={active} tone="aqua" icon={<Handshake className="size-4" />} />
        <StatCard label="Terms agreed" value={agreed} tone="gold" />
        <StatCard label="Inbound enquiries" value={inbound} sub="From the public page" />
      </div>

      <GlassCard className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <Input
            className="flex-1"
            placeholder="Search partners"
            aria-label="Search partners"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="lg:w-56" aria-label="Filter by partner type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All partner types</SelectItem>
              {PARTNER_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="lg:w-48" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {PARTNER_STATUSES.map((s) => (
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
          title="No partners yet"
          description="Add the first hotel, operator or planner you plan to approach."
        />
      ) : (
        <GlassCard className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organisation</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead>Next follow-up</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <p className="font-medium">{row.name}</p>
                    {row.notes ? <p className="mt-1 max-w-sm text-xs text-muted-foreground">{row.notes}</p> : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.partner_type}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <p>{row.contact_name ?? "—"}</p>
                    <p>{row.phone ?? ""}</p>
                    <p>{row.email ?? ""}</p>
                  </TableCell>
                  <TableCell className="text-right">
                    {row.commission_pct == null ? "—" : pct(row.commission_pct)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{dateLabel(row.next_follow_up)}</TableCell>
                  <TableCell>
                    {canEdit ? (
                      <Select value={row.status} onValueChange={(value) => save.mutate({ id: row.id, status: value })}>
                        <SelectTrigger className="w-40" aria-label={`Status for ${row.name}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PARTNER_STATUSES.map((s) => (
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
        title={editing ? "Edit partner" : "Add partner"}
        fields={FIELDS}
        value={editing}
        submitting={save.isPending}
        onSubmit={(values) => save.mutate(values, { onSuccess: () => setDialogOpen(false) })}
      />

      <ConfirmDelete
        open={Boolean(deleteId)}
        onOpenChange={(o) => !o && setDeleteId(null)}
        label="partner"
        onConfirm={() => deleteId && remove.mutate(deleteId)}
      />
    </div>
  );
}
