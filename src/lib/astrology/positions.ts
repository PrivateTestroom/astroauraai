// Planet positions (tropical + sidereal) using astronomy-engine + analytical
// formulas for Rahu (mean lunar node).
import { EclipticLongitude, MakeTime, SiderealTime } from "astronomy-engine";
import {
  PLANETS, PLANET_BODY, type Planet,
  lahiriAyanamsa, norm360,
} from "./constants";

/**
 * Mean longitude of the ascending lunar node (Rahu) — analytical formula
 * from Meeus, Astronomical Algorithms ch.47, accurate to a few arcminutes.
 * Returns tropical longitude in degrees.
 */
export function meanRahuLongitude(date: Date): number {
  const T = (date.getTime() / 86400000 + 2440587.5 - 2451545.0) / 36525;
  // Mean longitude of ascending node Ω
  const omega = 125.04452 - 1934.136261 * T + 0.0020708 * T * T + (T * T * T) / 450000;
  return norm360(omega);
}

export type PlanetPositionTrop = {
  planet: Planet;
  tropical: number;     // 0..360
  sidereal: number;     // 0..360 (Lahiri)
  retro: boolean;
};

/** Tropical longitude of a planet (Rahu/Ketu use mean node). */
export function tropicalLongitude(planet: Planet, date: Date): number {
  if (planet === "Rahu") return meanRahuLongitude(date);
  if (planet === "Ketu") return norm360(meanRahuLongitude(date) + 180);
  const t = MakeTime(date);
  return norm360(EclipticLongitude(PLANET_BODY[planet], t));
}

/** Crude retrograde detection: compare longitude now vs 24h later. */
export function isRetro(planet: Planet, date: Date): boolean {
  if (planet === "Sun" || planet === "Moon") return false;
  if (planet === "Rahu" || planet === "Ketu") return true; // nodes always considered retrograde
  const now = tropicalLongitude(planet, date);
  const next = tropicalLongitude(planet, new Date(date.getTime() + 86400_000));
  const delta = ((next - now + 540) % 360) - 180;
  return delta < 0;
}

/** All 9 grahas at a moment. */
export function allPlanetPositions(date: Date): PlanetPositionTrop[] {
  const ay = lahiriAyanamsa(date);
  return PLANETS.map((p) => {
    const trop = tropicalLongitude(p, date);
    return { planet: p, tropical: trop, sidereal: norm360(trop - ay), retro: isRetro(p, date) };
  });
}

/** Local sidereal time in degrees. */
export function lstDeg(date: Date, lonDeg: number): number {
  const t = MakeTime(date);
  const gst = SiderealTime(t); // hours
  return norm360((gst + lonDeg / 15) * 15);
}

/** Tropical ascendant (Lagna in tropical zodiac). */
export function tropicalAscendant(date: Date, lat: number, lon: number): number {
  const ramc = (lstDeg(date, lon) * Math.PI) / 180;
  const obl = (23.4393 * Math.PI) / 180;
  const phi = (lat * Math.PI) / 180;
  const y = -Math.cos(ramc);
  const x = Math.sin(ramc) * Math.cos(obl) + Math.tan(phi) * Math.sin(obl);
  return norm360((Math.atan2(y, x) * 180) / Math.PI);
}

/** Tropical MC. */
export function tropicalMC(date: Date, lon: number): number {
  const ramc = (lstDeg(date, lon) * Math.PI) / 180;
  const obl = (23.4393 * Math.PI) / 180;
  return norm360((Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(obl)) * 180) / Math.PI);
}