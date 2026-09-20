import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText, Plus, Trash2, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { EmptyState, GlassCard, SectionHeading, StatCard } from "@/components/glass";
import { ConfirmDelete, RecordDialog, type FieldDef } from "@/components/record-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DOCUMENT_SECTIONS } from "@/lib/constants";
import { useDeleteRow, useRows, useSaveRow } from "@/lib/data";
import { dateLabel } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/documents")({
  head: () => ({
    meta: [
      { title: "Document Centre — RovaX Blue Launch Command Center" },
      {
        name: "description",
        content:
          "One place for concept decks, supplier quotations, permissions, insurance, SOPs and partnership agreements.",
      },
      { property: "og:title", content: "Document Centre — RovaX Blue Launch Command Center" },
      {
        property: "og:description",
        content: "Concept decks, quotations, permissions, insurance, SOPs and agreements for the RovaX Blue pilot.",
      },
    ],
  }),
  component: DocumentsPage,
});

const FIELDS: FieldDef[] = [
  { name: "title", label: "Document", required: true, colSpan: 2 },
  { name: "section", label: "Section", type: "select", options: DOCUMENT_SECTIONS as unknown as string[] },
  { name: "link_url", label: "External link", type: "url", placeholder: "https://" },
  { name: "notes", label: "Notes", type: "textarea", colSpan: 2 },
];

function DocumentsPage() {
  const { canEdit } = useAuth();
  const documents = useRows("documents", { column: "section" });
  const save = useSaveRow("documents", "Document");
  const remove = useDeleteRow("documents", "Document");

  const [search, setSearch] = useState("");
  const [section, setSection] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const all = documents.data ?? [];
  const rows = useMemo(
    () =>
      all.filter(
        (d) =>
          `${d.title} ${d.notes ?? ""}`.toLowerCase().includes(search.toLowerCase()) &&
          (section === "all" || d.section === section),
      ),
    [all, search, section],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, typeof rows>();
    for (const row of rows) {
      map.set(row.section, [...(map.get(row.section) ?? []), row]);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [rows]);

  const handleUpload = async (row: { id: string; section: string }, file: File) => {
    setUploadingId(row.id);
    try {
      const path = `${row.section}/${row.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("documents").upload(path, file);
      if (error) throw error;
      save.mutate({ id: row.id, storage_path: path });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploadingId(null);
    }
  };

  const openFile = async (path: string) => {
    const { data, error } = await supabase.storage.from("documents").createSignedUrl(path, 3600);
    if (error || !data) {
      toast.error("Could not open this file");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  };

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Module 11"
        title="Document Centre"
        description="Placeholders are listed for each document you will need. Nothing is treated as existing until you upload it."
        actions={
          canEdit ? (
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="size-4" /> Add document
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Document slots" value={all.length} icon={<FileText className="size-4" />} />
        <StatCard
          label="Files uploaded"
          value={all.filter((d) => d.storage_path).length}
          tone="aqua"
        />
        <StatCard label="Still missing" value={all.filter((d) => !d.storage_path && !d.link_url).length} tone="gold" />
      </div>

      <GlassCard className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            className="flex-1"
            placeholder="Search documents"
            aria-label="Search documents"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={section} onValueChange={setSection}>
            <SelectTrigger className="sm:w-52" aria-label="Filter by section">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sections</SelectItem>
              {DOCUMENT_SECTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </GlassCard>

      {grouped.length === 0 ? (
        <EmptyState title="No documents match" description="Try a different search or section." />
      ) : (
        grouped.map(([sectionName, items]) => (
          <div key={sectionName} className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{sectionName}</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((row) => (
                <GlassCard key={row.id} hover className="flex flex-col gap-3 p-5">
                  <div>
                    <p className="font-medium">{row.title}</p>
                    {row.notes ? <p className="mt-1 text-xs text-muted-foreground">{row.notes}</p> : null}
                    <p className="mt-2 text-xs text-muted-foreground">Updated {dateLabel(row.updated_at)}</p>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2">
                    {row.storage_path ? (
                      <Button variant="secondary" size="sm" onClick={() => void openFile(row.storage_path)}>
                        <Download className="size-4" /> Open file
                      </Button>
                    ) : null}
                    {row.link_url ? (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={row.link_url} target="_blank" rel="noreferrer noopener">
                          Open link
                        </a>
                      </Button>
                    ) : null}
                    {canEdit ? (
                      <>
                        <input
                          ref={(el) => {
                            fileInputs.current[row.id] = el;
                          }}
                          type="file"
                          className="hidden"
                          aria-label={`Upload file for ${row.title}`}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void handleUpload(row, file);
                            e.target.value = "";
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={uploadingId === row.id}
                          onClick={() => fileInputs.current[row.id]?.click()}
                        >
                          <Upload className="size-4" />
                          {uploadingId === row.id ? "Uploading…" : row.storage_path ? "Replace" : "Upload"}
                        </Button>
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
                      </>
                    ) : null}
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        ))
      )}

      <RecordDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit document" : "Add document"}
        fields={FIELDS}
        value={editing}
        submitting={save.isPending}
        onSubmit={(values) => save.mutate(values, { onSuccess: () => setDialogOpen(false) })}
      />

      <ConfirmDelete
        open={Boolean(deleteId)}
        onOpenChange={(o) => !o && setDeleteId(null)}
        label="document"
        onConfirm={() => deleteId && remove.mutate(deleteId)}
      />
    </div>
  );
}
