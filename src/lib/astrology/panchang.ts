// Daily Panchang: Tithi, Vara, Nakshatra, Yoga, Karana.
import { NAKSHATRAS, nakIndexFromLon, lahiriAyanamsa, norm360 } from "./constants";
import { allPlanetPositions } from "./positions";

const TITHIS = [
  "Pratipada","Dwitiya","Tritiya","Chaturthi","Panchami","Shashthi","Saptami","Ashtami","Navami","Dashami",
  "Ekadashi","Dwadashi","Trayodashi","Chaturdashi","Purnima",
  "Pratipada (K)","Dwitiya (K)","Tritiya (K)","Chaturthi (K)","Panchami (K)","Shashthi (K)","Saptami (K)","Ashtami (K)","Navami (K)","Dashami (K)",
  "Ekadashi (K)","Dwadashi (K)","Trayodashi (K)","Chaturdashi (K)","Amavasya",
];

const VARAS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

const YOGAS = [
  "Vishkambha","Priti","Ayushman","Saubhagya","Shobhana","Atiganda","Sukarman","Dhriti","Shoola","Ganda",
  "Vriddhi","Dhruva","Vyaghata","Harshana","Vajra","Siddhi","Vyatipata","Variyana","Parigha","Shiva",
  "Siddha","Sadhya","Shubha","Shukla","Brahma","Indra","Vaidhriti",
];

const KARANAS_MOVABLE = ["Bava","Balava","Kaulava","Taitila","Garaja","Vanija","Vishti"];
const KARANAS_FIXED = ["Shakuni","Chatushpada","Naga","Kimstughna"];

export type Panchang = {
  date: string;
  tithi: string;
  paksha: "Shukla" | "Krishna";
  vara: string;
  nakshatra: string;
  yoga: string;
  karana: string;
  sunSign: string;
  moonSign: string;
};

export function computePanchang(date = new Date()): Panchang {
  const positions = allPlanetPositions(date);
  const ay = lahiriAyanamsa(date);
  const sun = positions.find((p) => p.planet === "Sun")!.tropical;
  const moon = positions.find((p) => p.planet === "Moon")!.tropical;
  const sunSid = norm360(sun - ay);
  const moonSid = norm360(moon - ay);

  // Tithi: 12° steps of moon − sun
  const diff = norm360(moon - sun);
  const tithiIdx = Math.floor(diff / 12); // 0..29
  const paksha: "Shukla" | "Krishna" = tithiIdx < 15 ? "Shukla" : "Krishna";

  // Nakshatra of Moon (sidereal)
  const nak = nakIndexFromLon(moonSid);

  // Yoga: (sun + moon) / 13°20', 27 yogas
  const yogaIdx = Math.floor(norm360(sun + moon) / (360 / 27));

  // Karana: half-tithi. Indices 1..56; karanas 0..6 movable then last 4 fixed
  const karanaIdx = Math.floor(diff / 6);
  let karana: string;
  if (karanaIdx === 0) karana = KARANAS_FIXED[3]; // Kimstughna
  else if (karanaIdx >= 57) karana = KARANAS_FIXED[(karanaIdx - 57) % 4];
  else karana = KARANAS_MOVABLE[(karanaIdx - 1) % 7];

  // Sun/Moon rashi (sidereal)
  const RASHIS_S = ["Mesha","Vrishabha","Mithuna","Karka","Simha","Kanya","Tula","Vrischika","Dhanu","Makara","Kumbha","Meena"];

  return {
    date: date.toISOString().slice(0, 10),
    tithi: TITHIS[tithiIdx % 30],
    paksha,
    vara: VARAS[date.getUTCDay()],
    nakshatra: NAKSHATRAS[nak.idx],
    yoga: YOGAS[yogaIdx % 27],
    karana,
    sunSign: RASHIS_S[Math.floor(sunSid / 30)],
    moonSign: RASHIS_S[Math.floor(moonSid / 30)],
  };
}