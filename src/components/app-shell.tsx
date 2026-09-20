import { Link, useRouterState } from "@tanstack/react-router";
import {
  Anchor,
  BarChart3,
  Building2,
  CalendarCheck,
  FileText,
  Gauge,
  Handshake,
  LogOut,
  MapPinned,
  Menu,
  Package,
  PresentationIcon,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { APP_ROLES } from "@/lib/constants";
import { cn } from "@/lib/utils";

// Modules currently built. Remaining modules (experiences, pipeline, partners,
// tasks, documents, reports, investor view, settings) are added here as their
// route files land.
const NAV = [
  { to: "/dashboard", label: "Executive Dashboard", icon: Gauge },
  { to: "/sites", label: "Site Evaluation", icon: MapPinned },
  { to: "/crm", label: "Meetings & Negotiation", icon: Handshake },
  { to: "/compliance", label: "Compliance & Safety", icon: ShieldCheck },
  { to: "/procurement", label: "Procurement", icon: Package },
  { to: "/finance", label: "Financial Model", icon: BarChart3 },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-primary/15 font-medium text-primary"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link to="/dashboard" className="flex items-center gap-3">
      <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <Anchor className="size-5" />
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold tracking-wide">RovaX Blue</span>
        <span className="block text-[11px] text-muted-foreground">Launch Command Center</span>
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, role, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const roleLabel = APP_ROLES.find((r) => r.value === role)?.label ?? "Pending role";

  return (
    <div className="min-h-screen lg:flex">
      <aside className="glass sticky top-0 hidden h-screen w-72 shrink-0 flex-col justify-between rounded-none border-y-0 border-l-0 p-5 lg:flex no-print">
        <div className="flex min-h-0 flex-col gap-6">
          <Brand />
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <NavLinks />
          </div>
        </div>
        <div className="space-y-3 border-t border-border pt-4">
          <div>
            <p className="truncate text-sm font-medium">{user?.email ?? "—"}</p>
            <Badge variant="outline" className="mt-1 rounded-full border-gold/30 bg-gold/10 text-gold">
              {roleLabel}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => void signOut()}>
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass sticky top-0 z-30 flex items-center justify-between gap-3 rounded-none border-x-0 border-t-0 px-4 py-3 lg:hidden no-print">
          <Brand />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open navigation">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 overflow-y-auto p-5">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="mt-6 space-y-6">
                <NavLinks onNavigate={() => setOpen(false)} />
                <div className="border-t border-border pt-4">
                  <p className="truncate text-sm">{user?.email}</p>
                  <p className="text-xs text-muted-foreground">{roleLabel}</p>
                  <Button variant="ghost" size="sm" className="mt-2 w-full justify-start" onClick={() => void signOut()}>
                    <LogOut className="size-4" /> Sign out
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
