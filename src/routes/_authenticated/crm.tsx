import { createFileRoute } from "@tanstack/react-router";
import { Plus, Printer, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState, GlassCard, SectionHeading, StatusBadge } from "@/components/glass";
import { ConfirmDelete, RecordDialog, type FieldDef } from "@/components/record-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { NEGOTIATION_QUESTIONS, PARTNERSHIP_MODELS, STAKEHOLDER_STATUSES } from "@/lib/constants";
import { useDeleteRow, useRows, useSaveRow } from "@/lib/data";
import { dateLabel } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/crm")({
  head: () => ({
    meta: [
      { title: "Meetings & Negotiation — RovaX Blue Launch Command Center" },
      {
        name: "description",
        content:
          "Track site stakeholders, meeting notes, the 15-question negotiation checklist and partnership models.",
      },
      { property: "og:title", content: "Meetings & Negotiation — RovaX Blue Launch Command Center" },
      {
        property: "og:description",
        content:
          "Track site stakeholders, meeting notes, the 15-question negotiation checklist and partnership models.",
      },
    ],
  }),
  component: CrmPage,
});

function CrmPage() {
  const { canEdit } = useAuth();
  const stakeholders = useRows("stakeholders", { column: "created_at" });
  const sites = useRows("sites", { column: "name" });
  const save = useSaveRow("stakeholders", "Stakeholder");
  const remove = useDeleteRow("stakeholders", "Stakeholder");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fields: FieldDef[] = [
    { name: "name", label: "Stakeholder name", required: true },
    { name: "organization", label: "Organisation / community / property" },
    { name: "stakeholder_role", label: "Role" },
    {
      name: "site_id",
      label: "Related site",
      type: "select",
      options: (sites.data ?? []).map((s) => ({ value: s.id, label: s.name })),
    },
    { name: "phone", label: "Phone / WhatsApp", type: "tel" },
    { name: "email", label: "Email", type: "email" },
    { name: "meeting_date", label: "Meeting date", type: "date" },
    { name: "follow_up_date", label: "Follow-up date", type: "date" },
    { name: "status", label: "Status", type: "select", options: STAKEHOLDER_STATUSES as unknown as string[] },
    { name: "notes", label: "Meeting notes", type: "textarea", colSpan: 2 },
  ];

  const rows = useMemo(() => {
    return (stakeholders.data ?? []).filter((s) => {
      const text = `${s.name} ${s.organization ?? ""} ${s.stakeholder_role ?? ""}`.toLowerCase();
      return text.includes(search.toLowerCase()) && (status === "all" || s.status === status);
    });
  }, [stakeholders.data, search, status]);

  const detail = (stakeholders.data ?? []).find((s) => s.id === detailId) ?? null;
  const siteName = (id: string | null) => (sites.data ?? []).find((s) => s.id === id)?.name ?? "—";

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Module 03"
        title="Site Meetings & Negotiation"
        description="Every conversation about permission, terms and partnership models — with a 15-question checklist you can complete live in the meeting."
        actions={
          canEdit ? (
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="size-4" /> Add stakeholder
            </Button>
          ) : null
        }
      />

      <GlassCard className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search stakeholders"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search stakeholders"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="sm:w-52" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STAKEHOLDER_STATUSES.map((s) => (
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
          title="No stakeholders recorded yet"
          description="Add the landowner, community leader, hotel manager or council contact you plan to meet."
          action={
            canEdit ? (
              <Button
                onClick={() => {
                  setEditing(null);
                  setDialogOpen(true);
                }}
              >
                <Plus className="size-4" /> Add stakeholder
              </Button>
            ) : undefined
          }
        />
      ) : (
        <GlassCard className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Organisation</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Meeting</TableHead>
                <TableHead>Follow-up</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} className="cursor-pointer" onClick={() => setDetailId(row.id)}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-muted-foreground">{row.organization ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{siteName(row.site_id)}</TableCell>
                  <TableCell className="text-muted-foreground">{dateLabel(row.meeting_date)}</TableCell>
                  <TableCell className="text-muted-foreground">{dateLabel(row.follow_up_date)}</TableCell>
                  <TableCell>
                    <StatusBadge value={row.status} />
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
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
        title={editing ? "Edit stakeholder" : "Add stakeholder"}
        fields={fields}
        value={editing}
        submitting={save.isPending}
        onSubmit={(values) => save.mutate(values, { onSuccess: () => setDialogOpen(false) })}
      />

      <ConfirmDelete
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        label="stakeholder"
        onConfirm={() => deleteId && remove.mutate(deleteId)}
      />

      <MeetingSheet
        record={detail}
        siteName={siteName(detail?.site_id ?? null)}
        canEdit={canEdit}
        onClose={() => setDetailId(null)}
      />
    </div>
  );
}

function MeetingSheet({
  record,
  siteName,
  canEdit,
  onClose,
}: {
  record: Record<string, any> | null;
  siteName: string;
  canEdit: boolean;
  onClose: () => void;
}) {
  const save = useSaveRow("stakeholders", "Meeting record");
  const [questions, setQuestions] = useState<Record<string, string> | null>(null);
  const [models, setModels] = useState<Record<string, boolean> | null>(null);

  const q = questions ?? ((record?.["questions"] ?? {}) as Record<string, string>);
  const m = models ?? ((record?.["models"] ?? {}) as Record<string, boolean>);
  const dirty = questions !== null || models !== null;

  return (
    <Sheet
      open={Boolean(record)}
      onOpenChange={(open) => {
        if (!open) {
          setQuestions(null);
          setModels(null);
          onClose();
        }
      }}
    >
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        {record ? (
          <>
            <SheetHeader className="no-print">
              <SheetTitle>{record["name"]}</SheetTitle>
              <SheetDescription>
                {record["organization"] ?? "—"} · {siteName} · Meeting {dateLabel(record["meeting_date"])}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 px-4 pb-10 print-plain">
              <div className="hidden print:block">
                <h1 className="text-xl font-semibold">RovaX Blue — Meeting Summary</h1>
                <p className="text-sm">
                  {record["name"]} · {record["organization"] ?? "—"} · {dateLabel(record["meeting_date"])}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 no-print">
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="size-4" /> Print one-page summary
                </Button>
                {canEdit && dirty ? (
                  <Button
                    size="sm"
                    disabled={save.isPending}
                    onClick={() =>
                      save.mutate(
                        { id: record["id"], questions: q, models: m },
                        {
                          onSuccess: () => {
                            setQuestions(null);
                            setModels(null);
                          },
                        },
                      )
                    }
                  >
                    Save checklist
                  </Button>
                ) : null}
              </div>

              <div>
                <h3 className="text-sm font-semibold">Partnership models discussed</h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {PARTNERSHIP_MODELS.map((model) => (
                    <label key={model.key} className="flex items-center gap-3 rounded-xl border border-border/70 p-3 text-sm">
                      <Checkbox
                        checked={Boolean(m[model.key])}
                        disabled={!canEdit}
                        onCheckedChange={(v) => setModels({ ...m, [model.key]: Boolean(v) })}
                      />
                      {model.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold">Negotiation checklist</h3>
                <div className="mt-3 space-y-4">
                  {NEGOTIATION_QUESTIONS.map((question, index) => (
                    <div key={question.key}>
                      <Label htmlFor={`q-${question.key}`} className="text-sm">
                        {index + 1}. {question.label}
                      </Label>
                      <Textarea
                        id={`q-${question.key}`}
                        rows={2}
                        className="mt-1.5"
                        disabled={!canEdit}
                        placeholder="Answer captured in the meeting"
                        value={q[question.key] ?? ""}
                        onChange={(e) => setQuestions({ ...q, [question.key]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold">Notes</h3>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{record["notes"] || "—"}</p>
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
