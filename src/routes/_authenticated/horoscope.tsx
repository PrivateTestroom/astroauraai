import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BottomNav } from "@/components/BottomNav";
import { PanchangWidget } from "@/components/PanchangWidget";
import { getDailyHoroscope } from "@/lib/horoscope.functions";
import { getMyChart } from "@/lib/chart.functions";
import { Sparkles, Heart, Briefcase, Activity, Star } from "lucide-react";
import { CosmicLoader } from "@/components/CosmicLoader";

export const Route = createFileRoute("/_authenticated/horoscope")({
  head: () => ({ meta: [{ title: "Daily Horoscope — AstroAura" }] }),
  component: HoroscopePage,
});

function HoroscopePage() {
  const hFn = useServerFn(getDailyHoroscope);
  const cFn = useServerFn(getMyChart);
  const horoscope = useQuery({ queryKey: ["horoscope-today"], queryFn: () => hFn({}), staleTime: 60 * 60 * 1000 });
  const chart = useQuery({ queryKey: ["my-chart"], queryFn: () => cFn({}) });
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <main className="relative z-10 mx-auto max-w-md px-4 pb-28 pt-8">
      <div className="text-xs uppercase tracking-widest text-accent">{today}</div>
      <h1 className="font-display mt-1 text-3xl font-bold">Your horoscope</h1>

      <PanchangWidget />

      {chart.data && (
        <section className="glass mt-5 grid grid-cols-3 gap-2 rounded-2xl p-4 text-center">
          <ChartChip label="Rashi" value={chart.data.moonRashi.sanskrit} />
          <ChartChip label="Nakshatra" value={chart.data.nakshatra.name} />
          <ChartChip label="Lagna" value={chart.data.ascendant?.sanskrit ?? "—"} />
        </section>
      )}

      {horoscope.isLoading && (
        <div className="glass mt-6 rounded-2xl p-6">
          <CosmicLoader label="Reading today's transits…" />
        </div>
      )}
      {horoscope.isError && (
        <div className="glass mt-6 rounded-2xl p-5 text-center text-sm text-muted-foreground">
          Couldn't read the sky right now. Pull to refresh in a moment.
        </div>
      )}

      {horoscope.data && (
        <>
          <section className="glass mt-6 rounded-2xl p-5">
            <Sparkles className="h-5 w-5 text-accent" />
            <p className="mt-3 text-sm leading-relaxed">{horoscope.data.summary}</p>
          </section>

          <div className="mt-4 grid gap-3">
            <Card icon={Heart} title="Love" body={horoscope.data.love} />
            <Card icon={Briefcase} title="Career" body={horoscope.data.career} />
            <Card icon={Activity} title="Health" body={horoscope.data.health} />
            <Card icon={Star} title="Lucky" body={horoscope.data.lucky} />
          </div>
        </>
      )}

      <BottomNav />
    </main>
  );
}

function ChartChip({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}

function Card({ icon: Icon, title, body }: { icon: typeof Heart; title: string; body?: string }) {
  if (!body) return null;
  return (
    <div className="glass flex gap-3 rounded-2xl p-4">
      <Icon className="h-4 w-4 shrink-0 text-accent" />
      <div>
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{title}</div>
        <div className="mt-0.5 text-sm">{body}</div>
      </div>
    </div>
  );
}