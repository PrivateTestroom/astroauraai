// Hellenistic astrology: sect, dignities (tropical), lots, profections, transits.
import {
  RASHIS, type Planet,
  TROPICAL_DOMICILE, TROPICAL_EXALT, norm360, signFromLon,
} from "./constants";
import { allPlanetPositions, tropicalAscendant, tropicalMC } from "./positions";

export type HelChart = {
  ascendant: number | null;        // tropical longitude
  mc: number | null;
  sect: "diurnal" | "nocturnal";
  planets: Array<{
    planet: Planet;
    tropical: number;
    sign: string;
    degree: number;
    house: number;                 // whole-sign
    domicile: boolean;
    exaltation: boolean;
    retro: boolean;
  }>;
  lots: { fortune: number | null; spirit: number | null; eros: number | null; necessity: number | null };
};

export function computeHellenistic(date: Date, lat: number, lon: number, timeKnown: boolean): HelChart {
  const positions = allPlanetPositions(date);
  const sun = positions.find((p) => p.planet === "Sun")!.tropical;
  const moon = positions.find((p) => p.planet === "Moon")!.tropical;

  let asc: number | null = null;
  let mc: number | null = null;
  let sect: "diurnal" | "nocturnal" = "diurnal";
  let ascSign = 0;
  if (timeKnown) {
    asc = tropicalAscendant(date, lat, lon);
    mc = tropicalMC(date, lon);
    ascSign = signFromLon(asc).idx;
    // Sun above horizon (in houses 7..12 tropical) → diurnal
    const sunHouse = ((signFromLon(sun).idx - ascSign + 12) % 12) + 1;
    sect = sunHouse >= 7 ? "diurnal" : "nocturnal";
  } else {
    // Fallback: 6am–6pm local = diurnal
    const localHour = (date.getUTCHours() + 5.5) % 24;
    sect = localHour >= 6 && localHour < 18 ? "diurnal" : "nocturnal";
  }

  const planetsOut = positions.map((p) => {
    const s = signFromLon(p.tropical);
    const dom = TROPICAL_DOMICILE[p.planet]?.includes(s.idx) ?? false;
    const exa = TROPICAL_EXALT[p.planet] === s.idx;
    const house = timeKnown ? ((s.idx - ascSign + 12) % 12) + 1 : 0;
    return {
      planet: p.planet, tropical: p.tropical, sign: RASHIS[s.idx],
      degree: s.deg, house, domicile: dom, exaltation: exa, retro: p.retro,
    };
  });

  let lots: HelChart["lots"] = { fortune: null, spirit: null, eros: null, necessity: null };
  if (asc !== null) {
    const venus = positions.find((p) => p.planet === "Venus")!.tropical;
    const mercury = positions.find((p) => p.planet === "Mercury")!.tropical;
    const fortune = sect === "diurnal" ? norm360(asc + moon - sun) : norm360(asc + sun - moon);
    const spirit  = sect === "diurnal" ? norm360(asc + sun - moon) : norm360(asc + moon - sun);
    const eros    = sect === "diurnal" ? norm360(asc + venus - spirit) : norm360(asc + spirit - venus);
    const necessity = sect === "diurnal" ? norm360(asc + fortune - mercury) : norm360(asc + mercury - fortune);
    lots = { fortune, spirit, eros, necessity };
  }

  return { ascendant: asc, mc, sect, planets: planetsOut, lots };
}

/** Annual profection: sign activated for the year and its lord. */
export function annualProfection(birth: Date, asOf: Date, ascSign: number): { houseAge: number; sign: string; lord: Planet } {
  const ageYears = Math.floor((asOf.getTime() - birth.getTime()) / (365.25 * 86400 * 1000));
  const profSign = (ascSign + (ageYears % 12)) % 12;
  const signLordTable: Planet[] = [
    "Mars","Venus","Mercury","Moon","Sun","Mercury",
    "Venus","Mars","Jupiter","Saturn","Saturn","Jupiter",
  ];
  return { houseAge: ageYears, sign: RASHIS[profSign], lord: signLordTable[profSign] };
}

/** Current transit positions of the 9 grahas (tropical). */
export function currentTransits(now = new Date()) {
  return allPlanetPositions(now).map((p) => ({
    planet: p.planet, tropical: p.tropical, sign: RASHIS[signFromLon(p.tropical).idx],
    retro: p.retro,
  }));
}

/** Tight transits to natal (within `orb` degrees of conjunction or opposition). */
export function tightTransits(natalChart: HelChart, now = new Date(), orb = 2): Array<{ transit: Planet; natal: Planet; aspect: string; orb: number }> {
  const tr = currentTransits(now);
  const out: Array<{ transit: Planet; natal: Planet; aspect: string; orb: number }> = [];
  for (const t of tr) {
    for (const n of natalChart.planets) {
      const diff = ((t.tropical - n.tropical + 540) % 360) - 180;
      const abs = Math.abs(diff);
      if (abs <= orb) out.push({ transit: t.planet, natal: n.planet, aspect: "conjunction", orb: +abs.toFixed(2) });
      else if (Math.abs(abs - 180) <= orb) out.push({ transit: t.planet, natal: n.planet, aspect: "opposition", orb: +Math.abs(abs - 180).toFixed(2) });
      else if (Math.abs(abs - 90) <= orb) out.push({ transit: t.planet, natal: n.planet, aspect: "square", orb: +Math.abs(abs - 90).toFixed(2) });
      else if (Math.abs(abs - 120) <= orb) out.push({ transit: t.planet, natal: n.planet, aspect: "trine", orb: +Math.abs(abs - 120).toFixed(2) });
    }
  }
  return out;
}