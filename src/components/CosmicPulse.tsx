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
      <div className="glass mt-3 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        <span className="text-muted-foreground">Sky is direct — no major planets in retrograde right now.</span>
      </div>
    );
  }

  return (
    <div className="glass mt-3 flex items-center gap-2 rounded-2xl border-primary/25 px-4 py-3 text-sm">
      <Flame className="h-4 w-4 shrink-0 text-primary" />
      <span className="truncate">
        <span className="font-semibold text-primary">{retro.join(" · ")}</span>{" "}
        <span className="text-muted-foreground">retrograde today — read before the shift.</span>
      </span>
    </div>
  );
}
