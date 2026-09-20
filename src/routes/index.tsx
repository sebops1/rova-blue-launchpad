import { createFileRoute, Link } from "@tanstack/react-router";
import { Anchor, Camera, Heart, Sparkles, Sunset, Waves } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { GlassCard } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { PARTNER_TYPES } from "@/lib/constants";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RovaX Blue — More Than a Beach. A Memory for Life." },
      {
        name: "description",
        content:
          "Crystal kayaks, sunset sails, floating breakfasts and cinematic drone memories on Sierra Leone's peninsula beaches. Join the waitlist.",
      },
      { property: "og:title", content: "RovaX Blue — More Than a Beach. A Memory for Life." },
      {
        property: "og:description",
        content: "Premium beach, water and photo experiences on Sierra Leone's coastline. Coming soon — join the waitlist.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const EXPERIENCES = [
  { icon: Waves, title: "Crystal Kayak Journeys", text: "Glide over clear water in a transparent kayak, guided and safety-briefed." },
  { icon: Sunset, title: "Sunset VIP", text: "Golden-hour paddle with a private cabana and chilled welcome drinks." },
  { icon: Heart, title: "Couples & Proposals", text: "Styled, intimate moments designed for the story you will retell for years." },
  { icon: Camera, title: "Cinematic Drone Memories", text: "Aerial films and photography of your experience, delivered to your phone." },
  { icon: Sparkles, title: "Floating Breakfast", text: "A beautifully styled breakfast served on the water at your own pace." },
  { icon: Anchor, title: "SUP & Snorkel", text: "Paddleboards, snorkel sets and calm-water exploring for all levels." },
];

function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/10 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Anchor className="size-5" />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-sm font-semibold tracking-wide">RovaX Blue</span>
              <span className="block text-[11px] text-muted-foreground">Beach • Water • Experiences</span>
            </span>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard">Team sign in</Link>
          </Button>
        </div>
      </header>

      <section className="hero-surface relative overflow-hidden px-5 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <span className="inline-flex rounded-full border border-gold/30 bg-gold/10 px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-gold">
            Coming soon
          </span>
          <h1 className="mt-6 font-display text-4xl font-semibold leading-tight sm:text-6xl">
            More Than a Beach.
            <span className="block text-gradient-aqua">A Memory for Life.</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Experience Sierra Leone Differently — crystal kayaks, sunset sails and cinematic memories on the Western Area
            Peninsula.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <a href="#waitlist">Join the waitlist</a>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <a href="#partner">Partner with us</a>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="font-display text-3xl font-semibold">The experiences</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          A small, carefully run line-up built around safety, beauty and the photographs you take home.
        </p>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {EXPERIENCES.map((item) => {
            const Icon = item.icon;
            return (
              <GlassCard key={item.title} hover className="p-6">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 font-medium">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
              </GlassCard>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16">
        <h2 className="font-display text-3xl font-semibold">Gallery</h2>
        <p className="mt-2 text-muted-foreground">
          Our own photography is being shot on location. These spaces are reserved for it.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {["Crystal kayak at sunrise", "Sunset cabana", "Drone over the bay", "Floating breakfast"].map((caption) => (
            <div
              key={caption}
              className="flex aspect-[4/5] flex-col justify-end rounded-2xl border border-dashed border-border/70 bg-secondary/30 p-4"
            >
              <p className="text-xs text-muted-foreground">Photo coming soon</p>
              <p className="text-sm">{caption}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-5 pb-24 lg:grid-cols-2">
        <WaitlistForm />
        <PartnerForm />
      </section>

      <footer className="border-t border-white/10 px-5 py-8 text-center text-sm text-muted-foreground">
        <p>RovaX Blue • Western Area Peninsula, Sierra Leone</p>
        <p className="mt-1">Launching as a 90-day pilot. Dates and pricing will be confirmed with waitlist members first.</p>
      </footer>
    </div>
  );
}

function WaitlistForm() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", desired_package: "", message: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || (!form.phone.trim() && !form.email.trim())) {
      toast.error("Please add your name and a phone number or email");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("leads").insert({
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      desired_package: form.desired_package.trim() || null,
      message: form.message.trim() || null,
      source: "Website waitlist",
      status: "New Lead",
    });
    setBusy(false);
    if (error) {
      toast.error("Sorry, that did not send. Please try again.");
      return;
    }
    toast.success("You're on the waitlist — we'll be in touch before we open bookings.");
    setForm({ name: "", phone: "", email: "", desired_package: "", message: "" });
  };

  return (
    <div id="waitlist" className="scroll-mt-24">
    <GlassCard className="p-6">
      <h2 className="font-display text-2xl font-semibold">Join the waitlist</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Waitlist members hear first about launch dates and founding-guest pricing.
      </p>
      <form className="mt-5 space-y-4" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="wl-name">Your name</Label>
            <Input id="wl-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wl-phone">Phone / WhatsApp</Label>
            <Input id="wl-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wl-email">Email</Label>
            <Input id="wl-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wl-package">Experience you want</Label>
            <Input
              id="wl-package"
              placeholder="Crystal kayak, sunset, proposal…"
              value={form.desired_package}
              onChange={(e) => setForm({ ...form, desired_package: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="wl-message">Anything we should know?</Label>
          <Textarea id="wl-message" rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? "Sending…" : "Join the waitlist"}
        </Button>
      </form>
    </GlassCard>
    </div>
  );
}

function PartnerForm() {
  const [form, setForm] = useState({ name: "", contact_name: "", phone: "", email: "", partner_type: "Hotel / Resort", message: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || (!form.phone.trim() && !form.email.trim())) {
      toast.error("Please add your organisation and a way to reach you");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("partners").insert({
      name: form.name.trim(),
      contact_name: form.contact_name.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      partner_type: form.partner_type,
      message: form.message.trim() || null,
      status: "Inbound Enquiry",
    });
    setBusy(false);
    if (error) {
      toast.error("Sorry, that did not send. Please try again.");
      return;
    }
    toast.success("Thank you — we'll come back to you about partnering.");
    setForm({ name: "", contact_name: "", phone: "", email: "", partner_type: "Hotel / Resort", message: "" });
  };

  return (
    <div id="partner" className="scroll-mt-24">
    <GlassCard className="p-6">
      <h2 className="font-display text-2xl font-semibold">Partner with us</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Hotels, hosts, tour operators, planners and creators — let&apos;s build the experience together.
      </p>
      <form className="mt-5 space-y-4" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pt-name">Organisation</Label>
            <Input id="pt-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pt-type">Partner type</Label>
            <Select value={form.partner_type} onValueChange={(v) => setForm({ ...form, partner_type: v })}>
              <SelectTrigger id="pt-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PARTNER_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pt-contact">Contact person</Label>
            <Input id="pt-contact" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pt-phone">Phone / WhatsApp</Label>
            <Input id="pt-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="pt-email">Email</Label>
            <Input id="pt-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pt-message">How would you like to work together?</Label>
          <Textarea id="pt-message" rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        </div>
        <Button type="submit" variant="secondary" disabled={busy}>
          {busy ? "Sending…" : "Send enquiry"}
        </Button>
      </form>
    </GlassCard>
    </div>
  );
}
