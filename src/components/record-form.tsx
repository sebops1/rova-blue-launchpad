import { useEffect, useState, type ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any */

export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "number" | "date" | "select" | "switch" | "email" | "tel" | "url";
  options?: readonly string[] | { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  help?: string;
  colSpan?: 1 | 2;
  min?: number;
  max?: number;
  step?: number;
};

export function RecordDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  value,
  onSubmit,
  submitting,
  extra,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: FieldDef[];
  value: Record<string, any> | null;
  onSubmit: (values: Record<string, any>) => void;
  submitting?: boolean;
  extra?: ReactNode;
}) {
  const [form, setForm] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm(value ? { ...value } : {});
      setErrors({});
    }
  }, [open, value]);

  const set = (name: string, v: any) => setForm((prev) => ({ ...prev, [name]: v }));

  const handleSubmit = () => {
    const next: Record<string, string> = {};
    for (const f of fields) {
      const v = form[f.name];
      if (f.required && (v === undefined || v === null || String(v).trim() === "")) {
        next[f.name] = `${f.label} is required`;
      }
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const payload: Record<string, any> = { ...form };
    for (const f of fields) {
      if (f.type === "number") {
        payload[f.name] = payload[f.name] === "" || payload[f.name] == null ? null : Number(payload[f.name]);
      }
      if ((f.type === "date" || f.type === "text" || f.type === "textarea") && payload[f.name] === "") {
        payload[f.name] = null;
      }
    }
    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((field) => {
            const id = `field-${field.name}`;
            const raw = form[field.name];
            return (
              <div key={field.name} className={cn("space-y-2", field.colSpan === 2 && "sm:col-span-2")}>
                <Label htmlFor={id}>
                  {field.label}
                  {field.required ? <span className="ml-1 text-destructive">*</span> : null}
                </Label>

                {field.type === "textarea" ? (
                  <Textarea
                    id={id}
                    rows={3}
                    value={raw ?? ""}
                    placeholder={field.placeholder}
                    onChange={(e) => set(field.name, e.target.value)}
                  />
                ) : field.type === "select" ? (
                  <Select value={raw ?? ""} onValueChange={(v) => set(field.name, v)}>
                    <SelectTrigger id={id}>
                      <SelectValue placeholder={field.placeholder ?? "Select"} />
                    </SelectTrigger>
                    <SelectContent>
                      {(field.options ?? []).map((opt) => {
                        const v = typeof opt === "string" ? opt : opt.value;
                        const l = typeof opt === "string" ? opt : opt.label;
                        return (
                          <SelectItem key={v} value={v}>
                            {l}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                ) : field.type === "switch" ? (
                  <div className="flex h-9 items-center">
                    <Switch id={id} checked={Boolean(raw)} onCheckedChange={(v) => set(field.name, v)} />
                  </div>
                ) : (
                  <Input
                    id={id}
                    type={field.type === "number" ? "number" : (field.type ?? "text")}
                    value={raw ?? ""}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    placeholder={field.placeholder}
                    onChange={(e) => set(field.name, e.target.value)}
                  />
                )}

                {errors[field.name] ? (
                  <p className="text-xs text-destructive">{errors[field.name]}</p>
                ) : field.help ? (
                  <p className="text-xs text-muted-foreground">{field.help}</p>
                ) : null}
              </div>
            );
          })}
        </div>

        {extra}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ConfirmDelete({
  open,
  onOpenChange,
  onConfirm,
  label,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  label: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete {label}?</DialogTitle>
          <DialogDescription>This permanently removes the record. It cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
