// KP (Krishnamurti Paddhati) — sub-lords, significators, ruling planets.
import {
  NAKSHATRAS, NAK_LORDS, VIM_YEARS, RASHIS,
  type DashaLord, type Planet,
  kpAyanamsa, norm360, signFromLon, nakIndexFromLon,
} from "./constants";
import {
  allPlanetPositions, lstDeg, tropicalAscendant,
} from "./positions";

function lordsFromLon(lonSid: number): { sign: string; star: DashaLord; sub: DashaLord; subSub: DashaLord } {
  const sign = RASHIS[signFromLon(lonSid).idx];
  const span = 360 / 27;
  const n = nakIndexFromLon(lonSid);
  const star = NAK_LORDS[n.idx % 9];
  const startIdx = NAK_LORDS.indexOf(star);
  // sub-lord: walk through 9 portions inside the nakshatra
  let cursor = 0;
  let sub: DashaLord = star;
  for (let i = 0; i < 9; i++) {
    const l = NAK_LORDS[(startIdx + i) % 9];
    const portion = (VIM_YEARS[l] / 120) * span;
    if (n.within < cursor + portion) { sub = l; break; }
    cursor += portion;
  }
  // sub-sub inside the sub portion
  const subStartIdx = NAK_LORDS.indexOf(sub);
  const subPortionStart = cursor;
  const subPortion = (VIM_YEARS[sub] / 120) * span;
  const withinSub = n.within - subPortionStart;
  let cursor2 = 0;
  let subSub: DashaLord = sub;
  for (let i = 0; i < 9; i++) {
    const l = NAK_LORDS[(subStartIdx + i) % 9];
    const portion = (VIM_YEARS[l] / 120) * subPortion;
    if (withinSub < cursor2 + portion) { subSub = l; break; }
    cursor2 += portion;
  }
  return { sign, star, sub, subSub };
}

export type KPCusps = Array<{
  house: number;
  longitude: number;
  sign: string;
  star: DashaLord;
  sub: DashaLord;
  subSub: DashaLord;
}>;

/**
 * KP cuspal sub-lords using Placidus-lite (equal-house from Ascendant as a
 * simple fallback). Real KP uses Placidus; equal-house is acceptable when
 * birth time is approximate and is what most free KP apps use as a fallback.
 */
export function computeKPCusps(date: Date, lat: number, lon: number): KPCusps {
  const ay = kpAyanamsa(date);
  const tropAsc = tropicalAscendant(date, lat, lon);
  const sidAsc = norm360(tropAsc - ay);
  const cusps: KPCusps = [];
  for (let h = 1; h <= 12; h++) {
    const lonH = norm360(sidAsc + (h - 1) * 30);
    const lords = lordsFromLon(lonH);
    cusps.push({ house: h, longitude: lonH, ...lords });
  }
  return cusps;
}

export type KPSignificators = Array<{
  planet: Planet;
  sign: string;
  star: DashaLord;
  sub: DashaLord;
  occupiedHouse: number;
  ownedHouses: number[];
  starLordOccupiedHouse: number;
  starLordOwnedHouses: number[];
}>;

export function computeKPSignificators(date: Date, lat: number, lon: number): KPSignificators {
  const ay = kpAyanamsa(date);
  const cusps = computeKPCusps(date, lat, lon);
  const ascSign = signFromLon(cusps[0].longitude).idx;
  const houseOfSign = (signIdx: number) => ((signIdx - ascSign + 12) % 12) + 1;

  const planetsRaw = allPlanetPositions(date).map((p) => {
    const sidKp = norm360(p.tropical - ay);
    const lords = lordsFromLon(sidKp);
    const sIdx = signFromLon(sidKp).idx;
    return {
      planet: p.planet,
      signIdx: sIdx,
      sign: RASHIS[sIdx],
      star: lords.star, sub: lords.sub,
      house: houseOfSign(sIdx),
    };
  });

  // sign ownership: which planet rules which sign
  const signRulers: Record<number, Planet> = {
    0: "Mars", 1: "Venus", 2: "Mercury", 3: "Moon", 4: "Sun", 5: "Mercury",
    6: "Venus", 7: "Mars", 8: "Jupiter", 9: "Saturn", 10: "Saturn", 11: "Jupiter",
  };
  const ownsHouses = (planet: Planet) => Object.entries(signRulers)
    .filter(([, ruler]) => ruler === planet)
    .map(([idx]) => houseOfSign(Number(idx)));

  return planetsRaw.map((p) => {
    const starLordRow = planetsRaw.find((x) => x.planet === (p.star as unknown as Planet));
    return {
      planet: p.planet, sign: p.sign, star: p.star, sub: p.sub,
      occupiedHouse: p.house,
      ownedHouses: ownsHouses(p.planet),
      starLordOccupiedHouse: starLordRow?.house ?? p.house,
      starLordOwnedHouses: ownsHouses(p.star as unknown as Planet),
    };
  });
}

export type RulingPlanets = {
  dayLord: DashaLord;
  ascStar: DashaLord;
  ascSub: DashaLord;
  moonStar: DashaLord;
  moonSub: DashaLord;
};

const DAY_LORDS: DashaLord[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

/** Ruling Planets for the current moment (used in KP horary). */
export function rulingPlanets(now: Date, lat: number, lon: number): RulingPlanets {
  const ay = kpAyanamsa(now);
  const lst = lstDeg(now, lon);
  const dayLord = DAY_LORDS[(now.getUTCDay() + 6) % 7]; // Mon=Moon, Tue=Mars...
  void lst;
  const sidAsc = norm360(tropicalAscendant(now, lat, lon) - ay);
  const ascLords = lordsFromLon(sidAsc);
  // Need moon sidereal:
  const moon = allPlanetPositions(now).find((p) => p.planet === "Moon")!;
  const moonLords = lordsFromLon(norm360(moon.tropical - ay));
  void NAKSHATRAS;
  return {
    dayLord,
    ascStar: ascLords.star,
    ascSub: ascLords.sub,
    moonStar: moonLords.star,
    moonSub: moonLords.sub,
  };
}