import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  computeVedicChart, computeVimshottari, currentDashaChain, detectYogas,
  birthToUtcDate,
} from "@/lib/astrology";
import { resolveCoords } from "@/lib/astrology/engine";

export const getMyKundli = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: p } = await context.supabase.from("profiles")
      .select("full_name,birth_year,birth_month,birth_day,birth_time,birth_time_known,state,city")
      .eq("id", context.userId).maybeSingle();
    if (!p?.birth_year || !p.birth_month || !p.birth_day) return null;
    const [h, m] = (p.birth_time ?? "12:00:00").split(":").map(Number);
    const coords = resolveCoords(p.city, p.state);
    const birth = {
      year: p.birth_year, month: p.birth_month, day: p.birth_day,
      hour: p.birth_time_known ? (h ?? 12) : 12,
      minute: p.birth_time_known ? (m ?? 0) : 0,
      lat: coords.lat, lon: coords.lon, timeKnown: !!p.birth_time_known,
    };
    const utc = birthToUtcDate(birth);
    const chart = computeVedicChart(utc, coords.lat, coords.lon, birth.timeKnown);
    const moon = chart.planets.find((pp) => pp.planet === "Moon")!;
    const dashas = computeVimshottari(utc, moon.degree + moon.sign * 30, 2);
    const current = currentDashaChain(dashas, new Date());
    const yogas = detectYogas(chart);
    return {
      name: p.full_name,
      birthSummary: `${p.birth_day}/${p.birth_month}/${p.birth_year}${birth.timeKnown ? ` ${p.birth_time}` : ""} · ${p.city ?? p.state ?? "India"}`,
      ascendant: chart.ascendant,
      planets: chart.planets,
      currentDasha: current.map((c) => ({ lord: c.lord, start: c.start.toISOString(), end: c.end.toISOString() })),
      upcomingMahaDashas: dashas.slice(0, 9).map((d) => ({ lord: d.lord, start: d.start.toISOString(), end: d.end.toISOString() })),
      yogas,
    };
  });