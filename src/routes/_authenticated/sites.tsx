import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState, GlassCard, PlanningTag, SectionHeading, StatusBadge } from "@/components/glass";
import { ConfirmDelete, RecordDialog, type FieldDef } from "@/components/record-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SCORE_CRITERIA, SITE_DECISIONS } from "@/lib/constants";
import { useDeleteRow, useRows, useSaveRow, useSettings } from "@/lib/data";
import { dateLabel, num } from "@/lib/format";
import { weightedScore } from "@/lib/readiness";

export const Route = createFileRoute("/_authenticated/sites")({
  head: () => ({
    meta: [
      { title: "Site Evaluation — RovaX Blue Launch Command Center" },
      {
        name: "description",
        content:
          "Score and compare candidate beach locations on 16 weighted criteria before choosing a preferred pilot site.",
      },
      { property: "og:title", content: "Site Evaluation — RovaX Blue Launch Command Center" },
      {
        property: "og:description",
        content:
          "Score and compare candidate beach locations on 16 weighted criteria before choosing a preferred pilot site.",
      },
    ],
  }),
  component: SitesPage,
});

const FIELDS: FieldDef[] = [
  { name: "name", label: "Site name", required: true },
  { name: "area", label: "Area / district" },
  { name: "decision", label: "Decision", type: "select", options: SITE_DECISIONS as unknown as string[] },
  { name: "visited_on", label: "Visit date", type: "date" },
  { name: "gps_notes", label: "GPS / location notes", colSpan: 2 },
  { name: "access_notes", label: "Access notes", type: "textarea", colSpan: 2 },
  { name: "weekday_observations", label: "Weekday observations", type: "textarea", colSpan: 2 },
  { name: "weekend_observations", label: "Weekend observations", type: "textarea", colSpan: 2 },
  { name: "tide_weather_notes", label: "Tide / weather notes", type: "textarea", colSpan: 2 },
  { name: "notes", label: "General notes", type: "textarea", colSpan: 2 },
];

function SitesPage() {
  const { canEdit } = useAuth();
  const sites = useRows("sites", { column: "name" });
  const settings = useSettings();
  const save = useSaveRow("sites", "Site");
  const remove = useDeleteRow("sites", "Site");

  const [search, setSearch] = useState("");
  const [decision, setDecision] = useState("all");
  const [sort, setSort] = useState<"score" | "name">("score");
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const weights = (settings.data?.["scoring_weights"] ?? {}) as Record<string, number>;

  const rows = useMemo(() => {
    const list = (sites.data ?? []).map((s) => ({ ...s, _score: weightedScore(s, weights) }));
    const filtered = list.filter((s) => {
      const matchesSearch = `${s.name} ${s.area ?? ""}`.toLowerCase().includes(search.toLowerCase());
      const matchesDecision = decision === "all" || s.decision === decision;
      return matchesSearch && matchesDecision;
    });
    return filtered.sort((a, b) =>
      sort === "name" ? a.name.localeCompare(b.name) : b._score.percent - a._score.percent,
    );
  }, [sites.data, weights, search, decision, sort]);

  const detail = (sites.data ?? []).find((s) => s.id === detailId) ?? null;

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Module 02"
        title="Site Evaluation"
        description="Six candidate beaches scored 1–10 across 16 weighted criteria. No location is pre-selected — the preferred site is decided from your own field data."
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
                <Plus className="size-4" /> Add site
              </Button>
            ) : null}
          </>
        }
      />

      <GlassCard className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search sites"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search sites"
            />
          </div>
          <Select value={decision} onValueChange={setDecision}>
            <SelectTrigger className="sm:w-48" aria-label="Filter by decision">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All decisions</SelectItem>
              {SITE_DECISIONS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as "score" | "name")}>
            <SelectTrigger className="sm:w-48" aria-label="Sort sites">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score">Sort by score</SelectItem>
              <SelectItem value="name">Sort by name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </GlassCard>

      {rows.length === 0 ? (
        <EmptyState title="No sites match your filters" description="Adjust the search or decision filter." />
      ) : (
        <GlassCard className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Site</TableHead>
                <TableHead>Area</TableHead>
                <TableHead className="w-56">Weighted score</TableHead>
                <TableHead>Decision</TableHead>
                <TableHead>Visited</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((site) => (
                <TableRow key={site.id} className="cursor-pointer" onClick={() => setDetailId(site.id)}>
                  <TableCell className="font-medium">{site.name}</TableCell>
                  <TableCell className="text-muted-foreground">{site.area ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Progress value={site._score.percent} className="h-1.5 w-28" />
                      <span className="text-xs text-muted-foreground">{num(site._score.percent, 1)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={site.decision} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{dateLabel(site.visited_on)}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    {canEdit ? (
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditing(site);
                            setDialogOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="Delete site" onClick={() => setDeleteId(site.id)}>
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
        title={editing ? "Edit site" : "Add site"}
        description="Field observations for a candidate beach location."
        fields={FIELDS}
        value={editing}
        submitting={save.isPending}
        onSubmit={(values) => save.mutate(values, { onSuccess: () => setDialogOpen(false) })}
      />

      <ConfirmDelete
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        label="site"
        onConfirm={() => deleteId && remove.mutate(deleteId)}
      />

      <SiteDetail site={detail} weights={weights} onClose={() => setDetailId(null)} canEdit={canEdit} />
    </div>
  );
}

function SiteDetail({
  site,
  weights,
  onClose,
  canEdit,
}: {
  site: Record<string, any> | null;
  weights: Record<string, number>;
  onClose: () => void;
  canEdit: boolean;
}) {
  const save = useSaveRow("sites", "Site scores");
  const [draft, setDraft] = useState<Record<string, number> | null>(null);
  const scores = draft ?? ((site?.["scores"] ?? {}) as Record<string, number>);

  const total = site ? weightedScore({ ...site, scores }, weights) : { percent: 0 };

  return (
    <Sheet
      open={Boolean(site)}
      onOpenChange={(open) => {
        if (!open) {
          setDraft(null);
          onClose();
        }
      }}
    >
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        {site ? (
          <>
            <SheetHeader>
              <SheetTitle>{site["name"]}</SheetTitle>
              <SheetDescription>
                {site["area"] ?? "Sierra Leone"} · Weighted score {num(total.percent, 1)}%
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 px-4 pb-10">
              <Progress value={total.percent} />

              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Scoring (1–10)</h3>
                {SCORE_CRITERIA.map((criterion) => {
                  const value = Number(scores[criterion.key] ?? 0);
                  return (
                    <div key={criterion.key}>
                      <div className="flex items-center justify-between text-sm">
                        <Label htmlFor={`score-${criterion.key}`}>{criterion.label}</Label>
                        <span className="text-muted-foreground">{value || "—"}</span>
                      </div>
                      <Slider
                        id={`score-${criterion.key}`}
                        className="mt-2"
                        min={0}
                        max={10}
                        step={1}
                        disabled={!canEdit}
                        value={[value]}
                        onValueChange={([v]) => setDraft({ ...scores, [criterion.key]: v ?? 0 })}
                      />
                    </div>
                  );
                })}
                {canEdit ? (
                  <Button
                    className="w-full"
                    disabled={!draft || save.isPending}
                    onClick={() =>
                      save.mutate({ id: site["id"], scores }, { onSuccess: () => setDraft(null) })
                    }
                  >
                    Save scores
                  </Button>
                ) : null}
              </div>

              <div className="space-y-3 text-sm">
                <Detail label="GPS / location" value={site["gps_notes"]} />
                <Detail label="Access" value={site["access_notes"]} />
                <Detail label="Weekday observations" value={site["weekday_observations"]} />
                <Detail label="Weekend observations" value={site["weekend_observations"]} />
                <Detail label="Tide / weather" value={site["tide_weather_notes"]} />
                <Detail label="Notes" value={site["notes"]} />
              </div>

              <SitePhotos siteId={site["id"]} canEdit={canEdit} />
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 whitespace-pre-wrap">{value || "—"}</p>
    </div>
  );
}

function SitePhotos({ siteId, canEdit }: { siteId: string; canEdit: boolean }) {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const photos = useQuery({
    queryKey: ["site_photos", siteId],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_photos").select("*").eq("site_id", siteId);
      if (error) throw error;
      const withUrls = await Promise.all(
        (data ?? []).map(async (photo) => {
          const signed = await supabase.storage.from("site-photos").createSignedUrl(photo.storage_path, 3600);
          return { ...photo, url: signed.data?.signedUrl ?? null };
        }),
      );
      return withUrls;
    },
  });

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const path = `${siteId}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
      const { error: uploadError } = await supabase.storage.from("site-photos").upload(path, file);
      if (uploadError) throw uploadError;
      const { error } = await supabase.from("site_photos").insert({ site_id: siteId, storage_path: path });
      if (error) throw error;
      toast.success("Photo uploaded");
      void qc.invalidateQueries({ queryKey: ["site_photos", siteId] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Site photos</h3>
        {canEdit ? (
          <Label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-1.5 text-xs">
            <ImagePlus className="size-4" />
            {uploading ? "Uploading…" : "Upload"}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleUpload(file);
                e.target.value = "";
              }}
            />
          </Label>
        ) : null}
      </div>
      {(photos.data ?? []).length === 0 ? (
        <p className="text-xs text-muted-foreground">No photos yet. Upload field photos from your site visit.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {(photos.data ?? []).map((photo) => (
            <img
              key={photo.id}
              src={photo.url ?? ""}
              alt={photo.caption ?? "Site photo"}
              className="h-32 w-full rounded-xl object-cover"
            />
          ))}
        </div>
      )}
    </div>
  );
}
