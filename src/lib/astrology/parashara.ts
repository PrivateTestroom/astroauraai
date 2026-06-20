// Parashara / Vedic Jyotish chart computation.
import {
  NAKSHATRAS, NAK_LORDS, VIM_YEARS, RASHIS, RASHIS_SANSKRIT,
  SIGN_LORD, EXALTATION, DEBILITATION,
  type Planet, type DashaLord,
  lahiriAyanamsa, norm360, signFromLon, nakIndexFromLon,
} from "./constants";
import { allPlanetPositions, tropicalAscendant, type PlanetPositionTrop } from "./positions";

export type Dignity = "Exalted" | "Debilitated" | "Own sign" | "Moolatrikona" | "Friend" | "Neutral";
export type PlanetPlacement = {
  planet: Planet;
  sign: number; signName: string; signSanskrit: string;
  degree: number;
  nakshatra: string; nakshatraLord: DashaLord; pada: number;
  house: number;            // 1..12 whole-sign from Ascendant
  retro: boolean;
  dignity: Dignity;
};

export function planetDignity(p: Planet, signIdx: number, deg: number): Dignity {
  const ex = EXALTATION[p];
  if (ex && ex.sign === signIdx) return "Exalted";
  if (DEBILITATION[p] === signIdx) return "Debilitated";
  const ownSigns = Object.entries(SIGN_LORD).filter(([, l]) => l === p).map(([i]) => Number(i));
  if (ownSigns.includes(signIdx)) {
    // crude moolatrikona for Sun=Leo 0-20, others rough
    if (p === "Sun" && signIdx === 4 && deg < 20) return "Moolatrikona";
    return "Own sign";
  }
  return "Neutral";
}

export type VedicChart = {
  ascendant: { sign: number; signName: string; signSanskrit: string; degree: number } | null;
  planets: PlanetPlacement[];
  moonNakshatra: { name: string; lord: DashaLord; pada: number };
  ayanamsa: number;
};

/** Compute the natal Vedic chart. */
export function computeVedicChart(date: Date, lat: number, lon: number, timeKnown: boolean): VedicChart {
  const ay = lahiriAyanamsa(date);
  const raw: PlanetPositionTrop[] = allPlanetPositions(date);

  let ascSign: number | null = null;
  let ascDeg = 0;
  if (timeKnown) {
    const tropAsc = tropicalAscendant(date, lat, lon);
    const sidAsc = norm360(tropAsc - ay);
    ascSign = Math.floor(sidAsc / 30);
    ascDeg = sidAsc - ascSign * 30;
  }

  const planets: PlanetPlacement[] = raw.map((r) => {
    const s = signFromLon(r.sidereal);
    const n = nakIndexFromLon(r.sidereal);
    const house = ascSign === null ? 0 : ((s.idx - ascSign + 12) % 12) + 1;
    return {
      planet: r.planet,
      sign: s.idx, signName: RASHIS[s.idx], signSanskrit: RASHIS_SANSKRIT[s.idx],
      degree: s.deg,
      nakshatra: NAKSHATRAS[n.idx],
      nakshatraLord: NAK_LORDS[n.idx % 9],
      pada: n.pada,
      house, retro: r.retro,
      dignity: planetDignity(r.planet, s.idx, s.deg),
    };
  });

  const moon = planets.find((p) => p.planet === "Moon")!;
  return {
    ascendant: ascSign === null ? null : {
      sign: ascSign, signName: RASHIS[ascSign], signSanskrit: RASHIS_SANSKRIT[ascSign], degree: ascDeg,
    },
    planets,
    moonNakshatra: { name: moon.nakshatra, lord: moon.nakshatraLord, pada: moon.pada },
    ayanamsa: ay,
  };
}

// -------- Vimshottari Dasha (Maha + Antar + Pratyantar) --------

export type DashaPeriod = {
  lord: DashaLord;
  start: Date;
  end: Date;
  sub?: DashaPeriod[];
};

const MS_PER_YEAR = 365.25 * 86400 * 1000;

function buildSubPeriods(parent: DashaPeriod, depth: number): DashaPeriod[] {
  if (depth === 0) return [];
  const totalMs = parent.end.getTime() - parent.start.getTime();
  const totalYears = 120;
  const lords = NAK_LORDS;
  const startIdx = lords.indexOf(parent.lord);
  const subs: DashaPeriod[] = [];
  let cursor = parent.start.getTime();
  for (let i = 0; i < 9; i++) {
    const lord = lords[(startIdx + i) % 9];
    const ms = totalMs * (VIM_YEARS[lord] / totalYears);
    const start = new Date(cursor);
    const end = new Date(cursor + ms);
    const node: DashaPeriod = { lord, start, end };
    if (depth > 1) node.sub = buildSubPeriods(node, depth - 1);
    subs.push(node);
    cursor += ms;
  }
  return subs;
}

/**
 * Vimshottari Dasha sequence built from Moon's nakshatra at birth.
 * Returns top-level Mahadasha periods, each with Antardasha (and optional Pratyantar) sub-periods.
 */
export function computeVimshottari(birth: Date, moonSidereal: number, depth = 2): DashaPeriod[] {
  const span = 360 / 27;
  const n = nakIndexFromLon(moonSidereal);
  const startLord = NAK_LORDS[n.idx % 9];
  const fraction = n.within / span;                   // 0..1 through the nakshatra
  const remainingFrac = 1 - fraction;
  const startLordYears = VIM_YEARS[startLord];
  const elapsedMs = startLordYears * MS_PER_YEAR * (1 - remainingFrac);
  // First Mahadasha begins at birth − elapsedMs
  let cursor = birth.getTime() - elapsedMs;

  const out: DashaPeriod[] = [];
  const startIdx = NAK_LORDS.indexOf(startLord);
  for (let i = 0; i < 9; i++) {
    const lord = NAK_LORDS[(startIdx + i) % 9];
    const ms = VIM_YEARS[lord] * MS_PER_YEAR;
    const start = new Date(cursor);
    const end = new Date(cursor + ms);
    const node: DashaPeriod = { lord, start, end };
    if (depth > 1) node.sub = buildSubPeriods(node, depth - 1);
    out.push(node);
    cursor += ms;
  }
  return out;
}

/** Find currently active Mahadasha → Antardasha → Pratyantar at `now`. */
export function currentDashaChain(periods: DashaPeriod[], now = new Date()): DashaPeriod[] {
  const chain: DashaPeriod[] = [];
  let level: DashaPeriod[] | undefined = periods;
  while (level) {
    const active: DashaPeriod | undefined = level.find((p) => p.start <= now && now < p.end);
    if (!active) break;
    chain.push(active);
    level = active.sub;
  }
  return chain;
}

// -------- Common Yogas --------

export type Yoga = { name: string; description: string };

export function detectYogas(chart: VedicChart): Yoga[] {
  const out: Yoga[] = [];
  const by = (p: Planet) => chart.planets.find((x) => x.planet === p)!;
  const moon = by("Moon");
  const jup = by("Jupiter");
  const sun = by("Sun");
  const sat = by("Saturn");

  // Gajakesari: Jupiter in kendra (1,4,7,10) from Moon
  const housesFromMoon = (sign: number) => ((sign - moon.sign + 12) % 12) + 1;
  if ([1, 4, 7, 10].includes(housesFromMoon(jup.sign))) {
    out.push({ name: "Gajakesari Yoga", description: "Jupiter in a kendra from the Moon — confers fame, wisdom, and longevity." });
  }

  // Kemadruma: no planet (except Sun) in 2nd or 12th from Moon
  const neighbors = chart.planets.filter((p) => p.planet !== "Moon" && p.planet !== "Sun")
    .some((p) => Math.abs(((p.sign - moon.sign + 12) % 12)) === 1 || ((p.sign - moon.sign + 12) % 12) === 11);
  if (!neighbors) {
    out.push({ name: "Kemadruma Yoga", description: "Moon isolated — emotional sensitivity; mitigated if planets aspect the Moon." });
  }

  // Budhaditya: Sun + Mercury same sign
  const merc = by("Mercury");
  if (merc.sign === sun.sign) {
    out.push({ name: "Budhaditya Yoga", description: "Sun & Mercury conjoint — intellect, eloquence, success in studies/communication." });
  }

  // Sasa (one of Pancha Mahapurusha): Saturn in own/exalted sign AND in a kendra (needs ascendant)
  if (chart.ascendant && (sat.dignity === "Own sign" || sat.dignity === "Exalted")) {
    if ([1, 4, 7, 10].includes(sat.house)) {
      out.push({ name: "Sasa Yoga (Pancha Mahapurusha)", description: "Saturn dignified in a kendra — leadership, longevity, authority over masses." });
    }
  }

  return out;
}