// Builds a compact structured astrology-context block for the AI based on
// which systems the astrologer is configured to use.
import {
  computeVedicChart, computeVimshottari, currentDashaChain, detectYogas,
  computeKPSignificators, rulingPlanets,
  computeHellenistic, currentTransits, tightTransits, annualProfection,
  computePanchang, birthToUtcDate, type BirthData,
} from "@/lib/astrology";

export type AstroSystem = "parashara" | "kp" | "hellenistic";

export type ChartBundle = {
  parashara?: string;
  kp?: string;
  hellenistic?: string;
  panchang?: string;
};

function fmt(num: number): string { return num.toFixed(2); }

export function buildAstrologyContext(
  birth: BirthData,
  systems: AstroSystem[],
  now = new Date(),
): ChartBundle {
  const utc = birthToUtcDate(birth);
  const bundle: ChartBundle = {};

  if (systems.includes("parashara")) {
    const chart = computeVedicChart(utc, birth.lat, birth.lon, birth.timeKnown);
    const moon = chart.planets.find((p) => p.planet === "Moon")!;
    const dashas = computeVimshottari(utc, moon.degree + moon.sign * 30, 2);
    const chain = currentDashaChain(dashas, now);
    const yogas = detectYogas(chart);
    bundle.parashara = `# PARASHARA (Vedic Jyotish)
Ascendant (Lagna): ${chart.ascendant ? `${chart.ascendant.signSanskrit} ${fmt(chart.ascendant.degree)}°` : "(birth time unknown)"}
Ayanamsa (Lahiri): ${fmt(chart.ayanamsa)}°
Planets (sign · degree · house · nakshatra · dignity${chart.ascendant ? "" : "; house omitted"}):
${chart.planets.map((p) => `  ${p.planet}: ${p.signSanskrit} ${fmt(p.degree)}°${p.house ? ` H${p.house}` : ""} · ${p.nakshatra} (lord ${p.nakshatraLord})${p.retro ? " R" : ""} · ${p.dignity}`).join("\n")}
Current Dasha: ${chain.map((c) => c.lord).join(" → ") || "—"} (Mahadasha ends ${chain[0]?.end.toISOString().slice(0,10)})
Yogas: ${yogas.length ? yogas.map((y) => y.name).join("; ") : "none of the major yogas detected"}`;
  }

  if (systems.includes("kp") && birth.timeKnown) {
    const sigs = computeKPSignificators(utc, birth.lat, birth.lon);
    const rp = rulingPlanets(now, birth.lat, birth.lon);
    bundle.kp = `# KP (Krishnamurti Paddhati)
Planet star/sub-lords and houses:
${sigs.map((s) => `  ${s.planet}: star ${s.star}, sub ${s.sub}, in H${s.occupiedHouse}, owns H${s.ownedHouses.join(",") || "—"}; star-lord in H${s.starLordOccupiedHouse} owns H${s.starLordOwnedHouses.join(",") || "—"}`).join("\n")}
Ruling Planets right now: day=${rp.dayLord}, asc-star=${rp.ascStar}/sub=${rp.ascSub}, moon-star=${rp.moonStar}/sub=${rp.moonSub}`;
  }

  if (systems.includes("hellenistic")) {
    const hel = computeHellenistic(utc, birth.lat, birth.lon, birth.timeKnown);
    const tr = tightTransits(hel, now, 2);
    const ascSign = hel.ascendant !== null ? Math.floor(hel.ascendant / 30) : 0;
    const prof = hel.ascendant !== null ? annualProfection(utc, now, ascSign) : null;
    bundle.hellenistic = `# HELLENISTIC / WESTERN
Sect: ${hel.sect}
Ascendant: ${hel.ascendant !== null ? `${fmt(hel.ascendant)}°` : "(no birth time)"}
Planets (tropical sign · degree · house · status):
${hel.planets.map((p) => `  ${p.planet}: ${p.sign} ${fmt(p.degree)}°${p.house ? ` H${p.house}` : ""}${p.domicile ? " [domicile]" : ""}${p.exaltation ? " [exalted]" : ""}${p.retro ? " R" : ""}`).join("\n")}
Lots: Fortune=${hel.lots.fortune !== null ? fmt(hel.lots.fortune) + "°" : "—"}, Spirit=${hel.lots.spirit !== null ? fmt(hel.lots.spirit) + "°" : "—"}
${prof ? `Annual profection: age ${prof.houseAge} → sign ${prof.sign} (lord ${prof.lord})` : ""}
Tight current transits to natal (≤2°): ${tr.length ? tr.map((t) => `${t.transit} ${t.aspect} natal ${t.natal} (${t.orb}°)`).join("; ") : "none"}
Current transits: ${currentTransits(now).map((t) => `${t.planet}=${t.sign}${t.retro ? "(R)" : ""}`).join(", ")}`;
  }

  // Always include panchang as ambient context — cheap and useful
  const p = computePanchang(now);
  bundle.panchang = `# PANCHANG (today)
Tithi: ${p.tithi} (${p.paksha}), Vara: ${p.vara}, Nakshatra: ${p.nakshatra}, Yoga: ${p.yoga}, Karana: ${p.karana}
Sun in ${p.sunSign}, Moon in ${p.moonSign}`;

  return bundle;
}

export function bundleToPrompt(bundle: ChartBundle, systems: AstroSystem[]): string {
  const parts = [
    bundle.parashara && systems.includes("parashara") ? bundle.parashara : null,
    bundle.kp && systems.includes("kp") ? bundle.kp : null,
    bundle.hellenistic && systems.includes("hellenistic") ? bundle.hellenistic : null,
    bundle.panchang,
  ].filter(Boolean);
  return parts.join("\n\n");
}