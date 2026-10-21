import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BottomNav } from "@/components/BottomNav";
import { PanchangWidget } from "@/components/PanchangWidget";
import { getDailyHoroscope } from "@/lib/horoscope.functions";
import { getMyChart } from "@/lib/chart.functions";
import { Sparkles, Heart, Briefcase, Activity, Star } from "lucide-react";
import { CosmicLoader } from "@/components/CosmicLoader";
import { useEffect } from "react";
import { bumpStreak } from "@/lib/social-proof";

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

  useEffect(() => { bumpStreak(); }, []);

  return (
    <main className="relative z-10 mx-auto max-w-md px-5 pb-32 pt-7 lg:pr-20 lg:pb-10">
      <div className="text-xs font-medium uppercase tracking-wider text-primary">{today}</div>
      <h1 className="font-display mt-1 text-3xl font-bold text-foreground">Your horoscope</h1>
      <p className="mt-1 text-sm text-muted-foreground">Based on your birth chart — refreshed every morning.</p>

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
          Couldn't read the sky right now. Try again in a moment.
        </div>
      )}

      {horoscope.data && (
        <>
          <section className="glass mt-6 rounded-2xl p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Today's summary</span>
            </div>
            <p className="mt-3 text-[15px] leading-relaxed text-foreground">{horoscope.data.summary}</p>
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
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display mt-1 text-base font-semibold text-foreground">{value}</div>
    </div>
  );
}

function Card({ icon: Icon, title, body }: { icon: typeof Heart; title: string; body?: string }) {
  if (!body) return null;
  return (
    <div className="glass flex gap-3 rounded-2xl p-4">
      <Icon className="h-5 w-5 shrink-0 text-primary" />
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
        <div className="mt-1 text-[15px] leading-relaxed text-foreground">{body}</div>
      </div>
    </div>
  );
}
