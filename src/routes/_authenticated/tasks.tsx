import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, KanbanSquare, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState, GlassCard, SectionHeading, StatCard, StatusBadge } from "@/components/glass";
import { ConfirmDelete, RecordDialog, type FieldDef } from "@/components/record-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { LAUNCH_TIMELINE, PRIORITIES, TASK_CATEGORIES, TASK_STATUSES } from "@/lib/constants";
import { useDeleteRow, useRows, useSaveRow } from "@/lib/data";
import { dateLabel, daysUntil } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({
    meta: [
      { title: "30-Day Launch Board — RovaX Blue Launch Command Center" },
      {
        name: "description",
        content:
          "Kanban and timeline view of every action needed to move RovaX Blue from site validation to the go / no-go decision.",
      },
      { property: "og:title", content: "30-Day Launch Board — RovaX Blue Launch Command Center" },
      {
        property: "og:description",
        content: "Kanban and timeline view of the 30-day RovaX Blue pilot launch plan.",
      },
    ],
  }),
  component: TasksPage,
});

const FIELDS: FieldDef[] = [
  { name: "title", label: "Task", required: true, colSpan: 2 },
  { name: "status", label: "Status", type: "select", options: TASK_STATUSES as unknown as string[] },
  { name: "category", label: "Category", type: "select", options: TASK_CATEGORIES as unknown as string[] },
  { name: "priority", label: "Priority", type: "select", options: PRIORITIES as unknown as string[] },
  { name: "owner", label: "Owner" },
  { name: "due_date", label: "Due date", type: "date" },
  { name: "week", label: "Launch week", type: "number", min: 1, max: 5 },
  { name: "notes", label: "Notes", type: "textarea", colSpan: 2 },
];

function TasksPage() {
  const { canEdit } = useAuth();
  const tasks = useRows("tasks", { column: "sort_order" });
  const save = useSaveRow("tasks", "Task");
  const remove = useDeleteRow("tasks", "Task");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const all = tasks.data ?? [];
  const rows = useMemo(
    () =>
      all.filter(
        (t) =>
          `${t.title} ${t.owner ?? ""} ${t.notes ?? ""}`.toLowerCase().includes(search.toLowerCase()) &&
          (category === "all" || t.category === category),
      ),
    [all, search, category],
  );

  const done = all.filter((t) => t.status === "Done").length;
  const overdue = all.filter((t) => {
    const d = daysUntil(t.due_date);
    return t.status !== "Done" && d !== null && d < 0;
  }).length;

  const openDialog = (row: Record<string, unknown> | null) => {
    setEditing(row);
    setDialogOpen(true);
  };

  function TaskCard({ row }: { row: Record<string, any> }) {
    const d = daysUntil(row.due_date as string);
    return (
      <GlassCard hover className="p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-snug">{row.title}</p>
          <StatusBadge value={row.priority} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{row.category}</span>
          {row.owner ? <span>• {row.owner}</span> : null}
          {row.due_date ? (
            <span className={d !== null && d < 0 && row.status !== "Done" ? "text-destructive" : ""}>
              • {dateLabel(row.due_date)}
            </span>
          ) : null}
        </div>
        {canEdit ? (
          <div className="mt-3 flex items-center gap-2">
            <Select value={row.status} onValueChange={(value) => save.mutate({ id: row.id, status: value })}>
              <SelectTrigger className="h-8 flex-1 text-xs" aria-label={`Status for ${row.title}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={() => openDialog(row)}>
              Edit
            </Button>
            <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => setDeleteId(row.id)}>
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        ) : null}
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Module 10"
        title="30-Day Launch Board"
        description="Everything that has to happen between today and the go / no-go decision."
        actions={
          canEdit ? (
            <Button onClick={() => openDialog(null)}>
              <Plus className="size-4" /> Add task
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tasks completed" value={`${done} / ${all.length}`} icon={<KanbanSquare className="size-4" />} />
        <StatCard label="This week" value={all.filter((t) => t.status === "This Week").length} tone="aqua" />
        <StatCard label="Waiting on others" value={all.filter((t) => t.status === "Waiting").length} tone="gold" />
        <StatCard label="Overdue" value={overdue} sub="Past due date and not done" />
      </div>

      <GlassCard className="p-4">
        <Progress value={all.length ? (done / all.length) * 100 : 0} className="h-2" />
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Input
            className="flex-1"
            placeholder="Search tasks"
            aria-label="Search tasks"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="sm:w-56" aria-label="Filter by category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {TASK_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </GlassCard>

      {rows.length === 0 ? (
        <EmptyState title="No tasks match" description="Try a different search or category filter." />
      ) : (
        <Tabs defaultValue="board">
          <TabsList>
            <TabsTrigger value="board">
              <KanbanSquare className="size-4" /> Board
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <CalendarDays className="size-4" /> Timeline
            </TabsTrigger>
          </TabsList>

          <TabsContent value="board" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {TASK_STATUSES.map((status) => {
                const columnRows = rows.filter((t) => t.status === status);
                return (
                  <div key={status} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold">{status}</h2>
                      <span className="text-xs text-muted-foreground">{columnRows.length}</span>
                    </div>
                    {columnRows.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-border/70 px-3 py-6 text-center text-xs text-muted-foreground">
                        Nothing here
                      </p>
                    ) : (
                      columnRows.map((row) => <TaskCard key={row.id} row={row} />)
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="mt-4 space-y-4">
            {LAUNCH_TIMELINE.map((phase) => {
              const phaseRows = rows.filter(
                (t) => t.week === phase.week || (t.week == null && phase.categories.includes(t.category)),
              );
              const phaseDone = phaseRows.filter((t) => t.status === "Done").length;
              return (
                <GlassCard key={phase.week} className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="font-semibold">{phase.title}</h2>
                      <p className="text-sm text-muted-foreground">{phase.detail}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {phaseDone} / {phaseRows.length} done
                    </span>
                  </div>
                  <Progress
                    className="mt-3 h-2"
                    value={phaseRows.length ? (phaseDone / phaseRows.length) * 100 : 0}
                  />
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {phaseRows.map((row) => (
                      <TaskCard key={row.id} row={row} />
                    ))}
                  </div>
                </GlassCard>
              );
            })}
          </TabsContent>
        </Tabs>
      )}

      <RecordDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit task" : "Add task"}
        fields={FIELDS}
        value={editing}
        submitting={save.isPending}
        onSubmit={(values) => save.mutate(values, { onSuccess: () => setDialogOpen(false) })}
      />

      <ConfirmDelete
        open={Boolean(deleteId)}
        onOpenChange={(o) => !o && setDeleteId(null)}
        label="task"
        onConfirm={() => deleteId && remove.mutate(deleteId)}
      />
    </div>
  );
}
