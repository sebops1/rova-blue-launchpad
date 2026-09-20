import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { GlassCard, SectionHeading } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { APP_ROLES, SCORE_CRITERIA } from "@/lib/constants";
import {
  DEFAULT_COMPANY,
  DEFAULT_CURRENCY,
  DEFAULT_FINANCE,
  useSaveSetting,
  useSettings,
} from "@/lib/data";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — RovaX Blue Launch Command Center" },
      {
        name: "description",
        content:
          "Company details, currency and exchange rate, operating assumptions, site scoring weights, branding and team roles.",
      },
      { property: "og:title", content: "Settings — RovaX Blue Launch Command Center" },
      {
        property: "og:description",
        content: "Company details, currency, operating assumptions, scoring weights and team roles.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { canEdit, isAdmin } = useAuth();
  const settings = useSettings();
  const saveSetting = useSaveSetting();

  const [company, setCompany] = useState<Record<string, any>>(DEFAULT_COMPANY);
  const [currency, setCurrency] = useState<Record<string, any>>(DEFAULT_CURRENCY);
  const [finance, setFinance] = useState<Record<string, any>>(DEFAULT_FINANCE);
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [branding, setBranding] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!settings.data) return;
    setCompany({ ...DEFAULT_COMPANY, ...(settings.data.company ?? {}) });
    setCurrency({ ...DEFAULT_CURRENCY, ...(settings.data.currency ?? {}) });
    setFinance({ ...DEFAULT_FINANCE, ...(settings.data.finance ?? {}) });
    setWeights({ ...(settings.data.scoring_weights ?? {}) });
    setBranding({ ...(settings.data.investor_share ?? {}) });
  }, [settings.data]);

  const save = (key: string, value: unknown) => saveSetting.mutate({ key, value });

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Settings"
        title="Workspace Settings"
        description="These values drive scoring, pricing and the financial model across every module."
      />

      <Tabs defaultValue="company">
        <TabsList className="flex-wrap">
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="currency">Currency</TabsTrigger>
          <TabsTrigger value="assumptions">Assumptions</TabsTrigger>
          <TabsTrigger value="weights">Scoring weights</TabsTrigger>
          <TabsTrigger value="team">Team & roles</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="mt-4">
          <GlassCard className="space-y-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { key: "name", label: "Company name" },
                { key: "tagline", label: "Tagline" },
                { key: "subtitle", label: "Positioning line" },
                { key: "email", label: "Contact email" },
                { key: "phone", label: "Contact phone / WhatsApp" },
                { key: "location", label: "Location" },
              ].map((f) => (
                <div key={f.key} className="space-y-2">
                  <Label htmlFor={`company-${f.key}`}>{f.label}</Label>
                  <Input
                    id={`company-${f.key}`}
                    disabled={!canEdit}
                    value={company[f.key] ?? ""}
                    onChange={(e) => setCompany({ ...company, [f.key]: e.target.value })}
                  />
                </div>
              ))}
              <div className="space-y-2">
                <Label htmlFor="company-launch">Target launch date</Label>
                <Input
                  id="company-launch"
                  type="date"
                  disabled={!canEdit}
                  value={company.launch_date ?? ""}
                  onChange={(e) => setCompany({ ...company, launch_date: e.target.value || null })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand-summary">Investor / share view summary note</Label>
              <Textarea
                id="brand-summary"
                rows={3}
                disabled={!canEdit}
                placeholder="Shown at the top of the read-only investor view."
                value={branding.summary ?? ""}
                onChange={(e) => setBranding({ ...branding, summary: e.target.value })}
              />
            </div>
            {canEdit ? (
              <Button
                onClick={() => {
                  save("company", company);
                  save("investor_share", branding);
                }}
              >
                Save company details
              </Button>
            ) : null}
          </GlassCard>
        </TabsContent>

        <TabsContent value="currency" className="mt-4">
          <GlassCard className="space-y-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="base-currency">Base currency</Label>
                <Input id="base-currency" value={currency.base ?? "USD"} disabled />
                <p className="text-xs text-muted-foreground">All planning figures are held in USD.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sle-rate">SLE per 1 USD</Label>
                <Input
                  id="sle-rate"
                  type="number"
                  min={0}
                  disabled={!canEdit}
                  value={currency.sle_rate ?? 0}
                  onChange={(e) => setCurrency({ ...currency, sle_rate: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">Indicative conversion only — update it as rates move.</p>
              </div>
            </div>
            {canEdit ? <Button onClick={() => save("currency", currency)}>Save currency settings</Button> : null}
          </GlassCard>
        </TabsContent>

        <TabsContent value="assumptions" className="mt-4">
          <GlassCard className="space-y-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { key: "capital", label: "Capital requirement (USD)" },
                { key: "monthly_opex", label: "Monthly operating expense (USD)" },
                { key: "variable_pct", label: "Variable cost (% of sales)" },
                { key: "operating_days", label: "Operating days per month" },
                { key: "opening_cash", label: "Opening cash (USD)" },
              ].map((f) => (
                <div key={f.key} className="space-y-2">
                  <Label htmlFor={`fin-${f.key}`}>{f.label}</Label>
                  <Input
                    id={`fin-${f.key}`}
                    type="number"
                    min={0}
                    disabled={!canEdit}
                    value={finance[f.key] ?? 0}
                    onChange={(e) => setFinance({ ...finance, [f.key]: Number(e.target.value) })}
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              These are planning estimates used across the financial model. They are not forecasts or guarantees.
            </p>
            {canEdit ? <Button onClick={() => save("finance", finance)}>Save assumptions</Button> : null}
          </GlassCard>
        </TabsContent>

        <TabsContent value="weights" className="mt-4">
          <GlassCard className="space-y-4 p-6">
            <p className="text-sm text-muted-foreground">
              Weights decide how much each criterion contributes to a site&apos;s weighted score.
            </p>
            <div className="grid gap-5 md:grid-cols-2">
              {SCORE_CRITERIA.map((c) => (
                <div key={c.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`w-${c.key}`}>{c.label}</Label>
                    <span className="text-sm text-muted-foreground">{weights[c.key] ?? 1}</span>
                  </div>
                  <Slider
                    id={`w-${c.key}`}
                    min={0}
                    max={5}
                    step={1}
                    disabled={!canEdit}
                    value={[Number(weights[c.key] ?? 1)]}
                    onValueChange={([v]) => setWeights({ ...weights, [c.key]: v })}
                  />
                </div>
              ))}
            </div>
            {canEdit ? <Button onClick={() => save("scoring_weights", weights)}>Save scoring weights</Button> : null}
          </GlassCard>
        </TabsContent>

        <TabsContent value="team" className="mt-4">
          <TeamPanel isAdmin={isAdmin} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TeamPanel({ isAdmin }: { isAdmin: boolean }) {
  const qc = useQueryClient();
  const team = useQuery({
    queryKey: ["team"],
    queryFn: async () => {
      const [{ data: profiles, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("user_roles").select("*"),
      ]);
      if (pErr) throw pErr;
      if (rErr) throw rErr;
      return (profiles ?? []).map((p) => ({
        ...p,
        role: (roles ?? []).find((r) => r.user_id === p.id)?.role ?? "viewer",
      }));
    },
  });

  const setRole = async (userId: string, role: string) => {
    const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
    if (delErr) {
      toast.error(delErr.message);
      return;
    }
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: role as never });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Role updated");
    void qc.invalidateQueries({ queryKey: ["team"] });
  };

  return (
    <GlassCard className="space-y-4 p-6">
      <div>
        <h2 className="font-semibold">Team & roles</h2>
        <p className="text-sm text-muted-foreground">
          Founder/Admin, Operations and Finance can edit records. Viewer/Investor is read-only.
        </p>
      </div>
      <div className="space-y-3">
        {(team.data ?? []).map((member) => (
          <div
            key={member.id}
            className="flex flex-col gap-3 rounded-xl border border-border/70 p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{member.full_name || member.email || member.id}</p>
              <p className="truncate text-xs text-muted-foreground">{member.email}</p>
            </div>
            {isAdmin ? (
              <Select value={member.role} onValueChange={(v) => void setRole(member.id, v)}>
                <SelectTrigger className="sm:w-56" aria-label={`Role for ${member.email}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APP_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="text-sm text-muted-foreground">
                {APP_ROLES.find((r) => r.value === member.role)?.label}
              </span>
            )}
          </div>
        ))}
        {(team.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No team members yet.</p>
        ) : null}
      </div>
    </GlassCard>
  );
}
