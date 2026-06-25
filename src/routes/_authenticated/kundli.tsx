import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BottomNav } from "@/components/BottomNav";
import { getMyKundli } from "@/lib/kundli.functions";
import { ArrowLeft, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/kundli")({
  head: () => ({ meta: [{ title: "Kundli — AstroAura" }] }),
  component: KundliPage,
});

function KundliPage() {
  const fn = useServerFn(getMyKundli);
  const q = useQuery({ queryKey: ["my-kundli"], queryFn: () => fn({}) });

  return (
    <main className="relative z-10 mx-auto max-w-md pl-4 pr-16 pb-10 pt-6">
      <Link to="/home" className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <ArrowLeft className="h-3 w-3" /> Back
      </Link>
      <h1 className="font-display mt-4 text-3xl">Your Kundli</h1>
      <p className="mt-1 text-xs text-muted-foreground">Computed with Lahiri ayanamsa · Parashara system</p>

      {q.isLoading && <p className="mt-8 text-center text-sm text-muted-foreground">Casting your chart…</p>}
      {q.isFetched && !q.data && (
        <div className="glass mt-8 rounded-2xl p-6 text-center text-sm">
          We need your birth details first.<br />
          <Link to="/onboarding" className="mt-3 inline-block rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-accent-foreground">Complete profile</Link>
        </div>
      )}
      {q.data && (
        <>
          <div className="glass mt-6 rounded-2xl p-4 text-center">
            <div className="font-display text-lg">{q.data.name}</div>
            <div className="text-xs text-muted-foreground">{q.data.birthSummary}</div>
            {q.data.ascendant && (
              <div className="mt-3 text-xs">
                Ascendant <span className="font-display text-accent">{q.data.ascendant.signSanskrit}</span> · {q.data.ascendant.degree.toFixed(1)}°
              </div>
            )}
          </div>

          <KundliChart planets={q.data.planets} ascendantSign={q.data.ascendant?.sign ?? null} />

          <section className="mt-6">
            <h2 className="font-display mb-2 text-sm font-semibold text-accent">Planets</h2>
            <div className="glass overflow-hidden rounded-2xl">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-white/5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr><th className="px-3 py-2">Planet</th><th>Sign</th><th>Deg</th><th>House</th><th>Nakshatra</th><th>Dignity</th></tr>
                </thead>
                <tbody>
                  {q.data.planets.map((p) => (
                    <tr key={p.planet} className="border-t border-white/5">
                      <td className="px-3 py-1.5 font-medium">{p.planet}{p.retro ? " ℞" : ""}</td>
                      <td>{p.signSanskrit}</td>
                      <td>{p.degree.toFixed(1)}°</td>
                      <td>{p.house || "—"}</td>
                      <td>{p.nakshatra}</td>
                      <td className="text-accent">{p.dignity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-6">
            <h2 className="font-display mb-2 text-sm font-semibold text-accent">Current Dasha</h2>
            <div className="glass rounded-2xl p-4 text-sm">
              {q.data.currentDasha.length === 0 ? (
                <p className="text-muted-foreground">No active period found.</p>
              ) : (
                <div className="space-y-1">
                  {q.data.currentDasha.map((d, i) => (
                    <div key={i} className="flex justify-between">
                      <span className={i === 0 ? "font-display text-accent" : ""}>{["Maha","Antar","Pratyantar"][i]}: {d.lord}</span>
                      <span className="text-[10px] text-muted-foreground">till {new Date(d.end).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="mt-6">
            <h2 className="font-display mb-2 text-sm font-semibold text-accent">Mahadasha timeline</h2>
            <div className="glass space-y-1 rounded-2xl p-4 text-[11px]">
              {q.data.upcomingMahaDashas.map((d, i) => {
                const now = Date.now();
                const start = new Date(d.start).getTime();
                const end = new Date(d.end).getTime();
                const active = start <= now && now < end;
                return (
                  <div key={i} className={`flex justify-between rounded-lg px-2 py-1 ${active ? "bg-accent/15 text-accent" : ""}`}>
                    <span>{d.lord}</span>
                    <span className="text-muted-foreground">{new Date(d.start).getFullYear()} → {new Date(d.end).getFullYear()}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {q.data.yogas.length > 0 && (
            <section className="mt-6">
              <h2 className="font-display mb-2 text-sm font-semibold text-accent">Yogas detected</h2>
              <div className="space-y-2">
                {q.data.yogas.map((y) => (
                  <div key={y.name} className="glass rounded-2xl p-3 text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-accent"><Sparkles className="h-3 w-3" /> {y.name}</div>
                    <p className="mt-1 text-muted-foreground">{y.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
      <BottomNav />
    </main>
  );
}

/** North-Indian style diamond chart (D1). */
function KundliChart({ planets, ascendantSign }: { planets: Array<{ planet: string; sign: number; house: number }>; ascendantSign: number | null }) {
  // North Indian: house 1 is top-diamond. Place planets in 12 cells by `house`.
  const PLANETS_ABBR: Record<string, string> = {
    Sun:"Su", Moon:"Mo", Mars:"Ma", Mercury:"Me", Jupiter:"Ju", Venus:"Ve", Saturn:"Sa", Rahu:"Ra", Ketu:"Ke",
  };
  const byHouse: Record<number, string[]> = {};
  for (const p of planets) {
    if (!p.house) continue;
    (byHouse[p.house] ??= []).push(PLANETS_ABBR[p.planet] ?? p.planet.slice(0,2));
  }
  // Cell positions for North-Indian layout on a 4x4 grid; each entry: [colStart, rowStart, colSpan, rowSpan]
  const layout: Record<number, { x: string; y: string; align?: string }> = {
    1:  { x: "left-1/2 -translate-x-1/2", y: "top-[18%]" },
    2:  { x: "left-[15%]", y: "top-[6%]" },
    3:  { x: "left-[6%]", y: "top-[18%]" },
    4:  { x: "left-[15%]", y: "top-1/2 -translate-y-1/2" },
    5:  { x: "left-[6%]", y: "bottom-[18%]" },
    6:  { x: "left-[15%]", y: "bottom-[6%]" },
    7:  { x: "left-1/2 -translate-x-1/2", y: "bottom-[18%]" },
    8:  { x: "right-[15%]", y: "bottom-[6%]" },
    9:  { x: "right-[6%]", y: "bottom-[18%]" },
    10: { x: "right-[15%]", y: "top-1/2 -translate-y-1/2" },
    11: { x: "right-[6%]", y: "top-[18%]" },
    12: { x: "right-[15%]", y: "top-[6%]" },
  };

  return (
    <div className="mt-6">
      <div className="relative mx-auto aspect-square w-full max-w-[320px]">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
          <rect x="2" y="2" width="96" height="96" fill="none" stroke="oklch(0.78 0.13 78 / 0.5)" strokeWidth="0.5" />
          <line x1="2" y1="2" x2="98" y2="98" stroke="oklch(0.78 0.13 78 / 0.5)" strokeWidth="0.5" />
          <line x1="98" y1="2" x2="2" y2="98" stroke="oklch(0.78 0.13 78 / 0.5)" strokeWidth="0.5" />
          <polygon points="50,2 98,50 50,98 2,50" fill="none" stroke="oklch(0.78 0.13 78 / 0.5)" strokeWidth="0.5" />
        </svg>
        {Object.entries(layout).map(([h, pos]) => (
          <div key={h} className={`absolute ${pos.x} ${pos.y} flex flex-col items-center text-[10px] leading-tight`}>
            <div className="font-display text-accent">{(((Number(h) - 1) + (ascendantSign ?? 0)) % 12) + 1}</div>
            <div className="flex flex-wrap justify-center gap-0.5 text-foreground/90">
              {(byHouse[Number(h)] ?? []).map((p, i) => <span key={i}>{p}</span>)}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-center text-[10px] text-muted-foreground">North-Indian style · house numbers show rashi from Lagna</p>
    </div>
  );
}