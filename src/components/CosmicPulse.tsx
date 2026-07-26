import { useMemo } from "react";
import { allPlanetPositions } from "@/lib/astrology/positions";
import { Flame } from "lucide-react";

/**
 * Live sky strip: which planets are currently retrograde. Computed from the
 * real ephemeris in src/lib/astrology — no fake data.
 */
export function CosmicPulse() {
  const retro = useMemo(() => {
    const now = new Date();
    return allPlanetPositions(now)
      .filter((p) => p.retro && p.planet !== "Rahu" && p.planet !== "Ketu")
      .map((p) => p.planet);
  }, []);

  if (retro.length === 0) {
    return (
      <div className="glass mt-3 flex items-center gap-2 rounded-2xl px-4 py-2.5 text-[11px]">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        <span className="text-muted-foreground">Sky is direct — no major planets in retrograde right now.</span>
      </div>
    );
  }

  return (
    <div className="glass mt-3 flex items-center gap-2 rounded-2xl border-accent/25 px-4 py-2.5 text-[11px]">
      <Flame className="h-3.5 w-3.5 shrink-0 text-accent" />
      <span className="truncate">
        <span className="font-semibold text-accent">{retro.join(" · ")}</span>{" "}
        <span className="text-muted-foreground">retrograde today — read before the shift.</span>
      </span>
    </div>
  );
}