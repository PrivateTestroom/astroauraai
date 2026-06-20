// Shared constants for all astrology engines.
import { Body } from "astronomy-engine";

export const PLANETS = [
  "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu",
] as const;
export type Planet = (typeof PLANETS)[number];

export const PLANET_BODY: Record<Exclude<Planet, "Rahu" | "Ketu">, Body> = {
  Sun: Body.Sun, Moon: Body.Moon, Mars: Body.Mars, Mercury: Body.Mercury,
  Jupiter: Body.Jupiter, Venus: Body.Venus, Saturn: Body.Saturn,
};

export const RASHIS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

export const RASHIS_SANSKRIT = [
  "Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
  "Tula", "Vrischika", "Dhanu", "Makara", "Kumbha", "Meena",
];

export const NAKSHATRAS = [
  "Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra","Punarvasu","Pushya","Ashlesha",
  "Magha","Purva Phalguni","Uttara Phalguni","Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha",
  "Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishta","Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati",
] as const;

// Vimshottari lords in sequence
export const NAK_LORDS = [
  "Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury",
] as const;
export type DashaLord = (typeof NAK_LORDS)[number];

export const VIM_YEARS: Record<DashaLord, number> = {
  Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17,
};

// Sign lords (Vedic / Jyotish)
export const SIGN_LORD: Record<number, Planet> = {
  0: "Mars", 1: "Venus", 2: "Mercury", 3: "Moon", 4: "Sun", 5: "Mercury",
  6: "Venus", 7: "Mars", 8: "Jupiter", 9: "Saturn", 10: "Saturn", 11: "Jupiter",
};

// Dignity tables (Parashara)
export const EXALTATION: Partial<Record<Planet, { sign: number; deg: number }>> = {
  Sun: { sign: 0, deg: 10 }, Moon: { sign: 1, deg: 3 }, Mars: { sign: 9, deg: 28 },
  Mercury: { sign: 5, deg: 15 }, Jupiter: { sign: 3, deg: 5 }, Venus: { sign: 11, deg: 27 },
  Saturn: { sign: 6, deg: 20 }, Rahu: { sign: 1, deg: 20 }, Ketu: { sign: 7, deg: 20 },
};
export const DEBILITATION: Partial<Record<Planet, number>> = {
  Sun: 6, Moon: 7, Mars: 3, Mercury: 11, Jupiter: 9, Venus: 5, Saturn: 0, Rahu: 7, Ketu: 1,
};

// Tropical / Hellenistic domiciles & exaltations (for tropical chart)
export const TROPICAL_DOMICILE: Partial<Record<Planet, number[]>> = {
  Sun: [4], Moon: [3], Mercury: [2, 5], Venus: [1, 6], Mars: [0, 7], Jupiter: [8, 11], Saturn: [9, 10],
};
export const TROPICAL_EXALT: Partial<Record<Planet, number>> = {
  Sun: 0, Moon: 1, Mercury: 5, Venus: 11, Mars: 9, Jupiter: 3, Saturn: 6,
};

export function norm360(x: number): number { return ((x % 360) + 360) % 360; }

export function signFromLon(lon: number): { idx: number; deg: number } {
  const l = norm360(lon);
  return { idx: Math.floor(l / 30), deg: l - Math.floor(l / 30) * 30 };
}

export function nakIndexFromLon(lon: number): { idx: number; pada: number; within: number; span: number } {
  const span = 360 / 27;
  const l = norm360(lon);
  const idx = Math.floor(l / span);
  const within = l - idx * span;
  return { idx, pada: Math.floor(within / (span / 4)) + 1, within, span };
}

// Lahiri ayanamsa (simple linear approximation, ±arcmin accuracy is enough)
export function lahiriAyanamsa(date: Date): number {
  const y = date.getUTCFullYear() + (date.getUTCMonth() + 1) / 12;
  return 23.85 + (y - 2000) * (50.29 / 3600);
}

// KP Ayanamsa (very close to Lahiri but slightly different epoch); use Lahiri − 0.06° as a working approximation
export function kpAyanamsa(date: Date): number { return lahiriAyanamsa(date) - 0.0615; }