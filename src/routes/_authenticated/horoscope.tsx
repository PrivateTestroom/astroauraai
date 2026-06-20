import { createFileRoute } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";
import { useProfile } from "@/lib/profile";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/horoscope")({
  head: () => ({ meta: [{ title: "Daily Horoscope — AstroAura" }] }),
  component: HoroscopePage,
});

function HoroscopePage() {
  const { data: profile } = useProfile();
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <main className="relative z-10 mx-auto max-w-md px-4 pb-28 pt-8">
      <div className="text-xs uppercase tracking-widest text-accent">{today}</div>
      <h1 className="font-display mt-1 text-3xl font-bold">Your horoscope</h1>

      <section className="glass mt-6 rounded-2xl p-6 text-center">
        <Sparkles className="mx-auto h-10 w-10 text-accent" />
        <p className="mt-4 font-display text-xl">Coming online soon</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {profile?.full_name ? `${profile.full_name.split(" ")[0]}, your` : "Your"} daily horoscope will appear here
          once Phase 3 (the Vedic / KP / Hellenistic engine) is shipped.
        </p>
      </section>

      <BottomNav />
    </main>
  );
}