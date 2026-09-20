import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Anchor, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { GlassCard } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Team Sign In — RovaX Blue Launch Command Center" },
      {
        name: "description",
        content: "Secure sign in for the RovaX Blue founder and operations team launch dashboard.",
      },
      { property: "og:title", content: "Team Sign In — RovaX Blue Launch Command Center" },
      {
        property: "og:description",
        content: "Secure sign in for the RovaX Blue founder and operations team launch dashboard.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || password.length < 6) {
      toast.error("Enter an email and a password of at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Account created");
          void navigate({ to: "/dashboard", replace: true });
        } else {
          toast.success("Check your inbox to confirm your email address.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        void navigate({ to: "/dashboard", replace: true });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sign in failed";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      setBusy(false);
      toast.error("Google sign in failed. Try email instead.");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/dashboard", replace: true });
  };

  return (
    <div className="hero-surface flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Anchor className="size-4 text-primary" />
          Back to RovaX Blue
        </Link>
        <GlassCard className="p-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Launch Command Center</h1>
            <p className="mt-1 text-sm text-muted-foreground">Internal access for the RovaX Blue team.</p>
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as "signin" | "signup")} className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
          </Tabs>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {mode === "signup" ? (
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              {mode === "signup" ? "Create account" : "Sign in"}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={busy}>
            Continue with Google
          </Button>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            The first account created becomes Founder / Admin. Later accounts join as Viewer / Investor until an
            admin upgrades them.
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
