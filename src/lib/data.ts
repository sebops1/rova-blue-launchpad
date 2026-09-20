import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Intentionally loose: rows are dynamic across many tables and are rendered
// through generic table/form components rather than per-table typed models.
export type Row = any;

type OrderSpec = { column: string; ascending?: boolean };

export function useRows<T extends Row = Row>(table: string, order?: OrderSpec) {
  return useQuery({
    queryKey: [table],
    queryFn: async () => {
      let query = (supabase.from(table as any) as any).select("*");
      if (order) query = query.order(order.column, { ascending: order.ascending ?? true });
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as T[];
    },
  });
}

export function useSaveRow(table: string, label = "Record") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Row) => {
      const { id, ...rest } = values;
      if (id) {
        const { error } = await (supabase.from(table as any) as any).update(rest).eq("id", id);
        if (error) throw error;
        return "updated";
      }
      const { error } = await (supabase.from(table as any) as any).insert(rest);
      if (error) throw error;
      return "created";
    },
    onSuccess: (mode) => {
      qc.invalidateQueries({ queryKey: [table] });
      toast.success(`${label} ${mode === "updated" ? "updated" : "created"}`);
    },
    onError: (error: any) => toast.error(error?.message ?? "Could not save changes"),
  });
}

export function useDeleteRow(table: string, label = "Record") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from(table as any) as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [table] });
      toast.success(`${label} deleted`);
    },
    onError: (error: any) => toast.error(error?.message ?? "Could not delete record"),
  });
}

export type SettingsMap = Record<string, any>;

export function useSettings() {
  return useQuery({
    queryKey: ["app_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_settings").select("*");
      if (error) throw error;
      const map: SettingsMap = {};
      for (const row of data ?? []) map[row.key] = row.value;
      return map;
    },
  });
}

export function useSaveSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await supabase.from("app_settings").upsert({ key, value });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["app_settings"] });
      toast.success("Settings saved");
    },
    onError: (error: any) => toast.error(error?.message ?? "Could not save settings"),
  });
}

export const DEFAULT_FINANCE = {
  capital: 20863,
  monthly_opex: 4400,
  variable_pct: 20,
  operating_days: 20,
  scenarios: [4000, 6000, 8000, 10000, 12000, 14000],
  opening_cash: 20863,
};

export const DEFAULT_CURRENCY = { base: "USD", sle_rate: 23000, show_sle: true };

export const DEFAULT_COMPANY = {
  name: "RovaX Blue",
  tagline: "More Than a Beach. A Memory for Life.",
  subtitle: "Experience Sierra Leone Differently.",
  email: "",
  phone: "",
  location: "Western Area Peninsula, Sierra Leone",
  launch_date: null as string | null,
};
