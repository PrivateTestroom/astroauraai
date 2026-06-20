// Pure-JS astrology engine using astronomy-engine. Worker-safe.
import { Body, Observer, EclipticLongitude, SiderealTime, MakeTime } from "astronomy-engine";

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

// KP / Vimshottari lord sequence; each nakshatra is "owned" by a planet in this order
const NAK_LORDS = ["Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury"] as const;
const VIM_YEARS = { Ketu:7, Venus:20, Sun:6, Moon:10, Mars:7, Rahu:18, Jupiter:16, Saturn:19, Mercury:17 } as const;

// Lahiri ayanamsa (degrees) approximation
export function lahiriAyanamsa(date: Date): number {
  const y = date.getUTCFullYear() + (date.getUTCMonth() + 1) / 12;
  return 23.85 + (y - 2000) * (50.29 / 3600);
}

function norm360(x: number) { return ((x % 360) + 360) % 360; }

export function siderealLongitude(body: Body, date: Date): number {
  const t = MakeTime(date);
  const trop = EclipticLongitude(body, t);
  return norm360(trop - lahiriAyanamsa(date));
}

export function signFromLongitude(lon: number) {
  const idx = Math.floor(norm360(lon) / 30);
  return { index: idx, name: RASHIS[idx], sanskrit: RASHIS_SANSKRIT[idx], degree: lon - idx * 30 };
}

export function nakshatraFromLongitude(lon: number) {
  const span = 360 / 27; // 13°20'
  const idx = Math.floor(norm360(lon) / span);
  const within = norm360(lon) - idx * span;
  const pada = Math.floor(within / (span / 4)) + 1;
  const lord = NAK_LORDS[idx % 9];
  // KP sub-lord: divide nakshatra by Vimshottari proportions starting from the nak's lord
  const startIdx = NAK_LORDS.indexOf(lord);
  let cursor = 0;
  let sub = lord;
  for (let i = 0; i < 9; i++) {
    const l = NAK_LORDS[(startIdx + i) % 9];
    const portion = (VIM_YEARS[l] / 120) * span;
    if (within < cursor + portion) { sub = l; break; }
    cursor += portion;
  }
  return { index: idx, name: NAKSHATRAS[idx], pada, lord, subLord: sub };
}

// Compute ascendant (lagna) tropical longitude, then convert to sidereal
export function ascendantLongitude(date: Date, latDeg: number, lonDeg: number): number {
  const t = MakeTime(date);
  const gstHours = SiderealTime(t); // GMST hours
  const lstHours = (gstHours + lonDeg / 15 + 24) % 24;
  const ramc = (lstHours * 15) * Math.PI / 180; // radians
  const obl = 23.4393 * Math.PI / 180;
  const phi = latDeg * Math.PI / 180;
  // Ecliptic ascendant formula
  const y = -Math.cos(ramc);
  const x = Math.sin(ramc) * Math.cos(obl) + Math.tan(phi) * Math.sin(obl);
  let asc = Math.atan2(y, x) * 180 / Math.PI;
  asc = norm360(asc);
  // Convert tropical → sidereal
  return norm360(asc - lahiriAyanamsa(date));
}

export type BirthInput = {
  year: number; month: number; day: number;
  hour: number; minute: number;          // local IST hours/minutes
  lat: number; lon: number;
  timeKnown: boolean;
};

export type ComputedChart = {
  date: string;
  sunRashi: { name: string; sanskrit: string };
  moonRashi: { name: string; sanskrit: string };
  nakshatra: { name: string; pada: number; lord: string; subLord: string };
  ascendant: { name: string; sanskrit: string; degree: number } | null;
  hellenistic: { sect: "diurnal" | "nocturnal"; lotOfFortune: string | null };
  ayanamsa: number;
};

export function computeChart(input: BirthInput): ComputedChart {
  // IST = UTC + 5:30
  const utc = new Date(Date.UTC(
    input.year, input.month - 1, input.day,
    input.hour - 5, input.minute - 30
  ));
  const sunLon = siderealLongitude(Body.Sun, utc);
  const moonLon = siderealLongitude(Body.Moon, utc);
  const sunSign = signFromLongitude(sunLon);
  const moonSign = signFromLongitude(moonLon);
  const nak = nakshatraFromLongitude(moonLon);

  let asc: ComputedChart["ascendant"] = null;
  let sect: "diurnal" | "nocturnal" = "diurnal";
  let lotFortune: string | null = null;

  if (input.timeKnown) {
    const ascLon = ascendantLongitude(utc, input.lat, input.lon);
    const a = signFromLongitude(ascLon);
    asc = { name: a.name, sanskrit: a.sanskrit, degree: a.degree };

    // Hellenistic sect: Sun above horizon ⇒ diurnal. Simplified: 6am–6pm local ⇒ diurnal.
    sect = (input.hour >= 6 && input.hour < 18) ? "diurnal" : "nocturnal";
    // Lot of Fortune (whole-sign approx): Asc + Moon − Sun (day); Asc + Sun − Moon (night)
    const lotLon = sect === "diurnal"
      ? norm360(ascLon + moonLon - sunLon)
      : norm360(ascLon + sunLon - moonLon);
    lotFortune = signFromLongitude(lotLon).name;
  }

  return {
    date: utc.toISOString(),
    sunRashi: { name: sunSign.name, sanskrit: sunSign.sanskrit },
    moonRashi: { name: moonSign.name, sanskrit: moonSign.sanskrit },
    nakshatra: { name: nak.name, pada: nak.pada, lord: nak.lord, subLord: nak.subLord },
    ascendant: asc,
    hellenistic: { sect, lotOfFortune: lotFortune },
    ayanamsa: Number(lahiriAyanamsa(utc).toFixed(4)),
  };
}

// Approximate latitude/longitude for Indian states (state capital).
export const STATE_COORDS: Record<string, { lat: number; lon: number }> = {
  "Andhra Pradesh": { lat: 16.5062, lon: 80.6480 },
  "Arunachal Pradesh": { lat: 27.0844, lon: 93.6053 },
  "Assam": { lat: 26.1445, lon: 91.7362 },
  "Bihar": { lat: 25.5941, lon: 85.1376 },
  "Chhattisgarh": { lat: 21.2514, lon: 81.6296 },
  "Goa": { lat: 15.4909, lon: 73.8278 },
  "Gujarat": { lat: 23.0225, lon: 72.5714 },
  "Haryana": { lat: 30.7333, lon: 76.7794 },
  "Himachal Pradesh": { lat: 31.1048, lon: 77.1734 },
  "Jharkhand": { lat: 23.3441, lon: 85.3096 },
  "Karnataka": { lat: 12.9716, lon: 77.5946 },
  "Kerala": { lat: 8.5241, lon: 76.9366 },
  "Madhya Pradesh": { lat: 23.2599, lon: 77.4126 },
  "Maharashtra": { lat: 19.0760, lon: 72.8777 },
  "Manipur": { lat: 24.8170, lon: 93.9368 },
  "Meghalaya": { lat: 25.5788, lon: 91.8933 },
  "Mizoram": { lat: 23.7271, lon: 92.7176 },
  "Nagaland": { lat: 25.6747, lon: 94.1086 },
  "Odisha": { lat: 20.2961, lon: 85.8245 },
  "Punjab": { lat: 30.7333, lon: 76.7794 },
  "Rajasthan": { lat: 26.9124, lon: 75.7873 },
  "Sikkim": { lat: 27.3314, lon: 88.6138 },
  "Tamil Nadu": { lat: 13.0827, lon: 80.2707 },
  "Telangana": { lat: 17.3850, lon: 78.4867 },
  "Tripura": { lat: 23.8315, lon: 91.2868 },
  "Uttar Pradesh": { lat: 26.8467, lon: 80.9462 },
  "Uttarakhand": { lat: 30.3165, lon: 78.0322 },
  "West Bengal": { lat: 22.5726, lon: 88.3639 },
  "Delhi": { lat: 28.6139, lon: 77.2090 },
  "Jammu and Kashmir": { lat: 34.0837, lon: 74.7973 },
  "Ladakh": { lat: 34.1526, lon: 77.5770 },
  "Puducherry": { lat: 11.9416, lon: 79.8083 },
  "Chandigarh": { lat: 30.7333, lon: 76.7794 },
  "Andaman and Nicobar Islands": { lat: 11.7401, lon: 92.6586 },
  "Dadra and Nagar Haveli and Daman and Diu": { lat: 20.3974, lon: 72.8328 },
  "Lakshadweep": { lat: 10.5667, lon: 72.6417 },
};

export const DEFAULT_COORDS = { lat: 20.5937, lon: 78.9629 }; // India centroid

// Major Indian cities — used when the user typed a city in onboarding.
// Keys are lowercased for case-insensitive lookup.
export const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  "mumbai": { lat: 19.0760, lon: 72.8777 },
  "navi mumbai": { lat: 19.0330, lon: 73.0297 },
  "thane": { lat: 19.2183, lon: 72.9781 },
  "pune": { lat: 18.5204, lon: 73.8567 },
  "nagpur": { lat: 21.1458, lon: 79.0882 },
  "nashik": { lat: 19.9975, lon: 73.7898 },
  "delhi": { lat: 28.6139, lon: 77.2090 },
  "new delhi": { lat: 28.6139, lon: 77.2090 },
  "noida": { lat: 28.5355, lon: 77.3910 },
  "gurgaon": { lat: 28.4595, lon: 77.0266 },
  "gurugram": { lat: 28.4595, lon: 77.0266 },
  "faridabad": { lat: 28.4089, lon: 77.3178 },
  "ghaziabad": { lat: 28.6692, lon: 77.4538 },
  "bangalore": { lat: 12.9716, lon: 77.5946 },
  "bengaluru": { lat: 12.9716, lon: 77.5946 },
  "mysore": { lat: 12.2958, lon: 76.6394 },
  "mangalore": { lat: 12.9141, lon: 74.8560 },
  "hyderabad": { lat: 17.3850, lon: 78.4867 },
  "secunderabad": { lat: 17.4399, lon: 78.4983 },
  "chennai": { lat: 13.0827, lon: 80.2707 },
  "coimbatore": { lat: 11.0168, lon: 76.9558 },
  "madurai": { lat: 9.9252, lon: 78.1198 },
  "tiruchirapalli": { lat: 10.7905, lon: 78.7047 },
  "trichy": { lat: 10.7905, lon: 78.7047 },
  "salem": { lat: 11.6643, lon: 78.1460 },
  "kolkata": { lat: 22.5726, lon: 88.3639 },
  "howrah": { lat: 22.5958, lon: 88.2636 },
  "siliguri": { lat: 26.7271, lon: 88.3953 },
  "ahmedabad": { lat: 23.0225, lon: 72.5714 },
  "surat": { lat: 21.1702, lon: 72.8311 },
  "vadodara": { lat: 22.3072, lon: 73.1812 },
  "rajkot": { lat: 22.3039, lon: 70.8022 },
  "jaipur": { lat: 26.9124, lon: 75.7873 },
  "jodhpur": { lat: 26.2389, lon: 73.0243 },
  "udaipur": { lat: 24.5854, lon: 73.7125 },
  "kota": { lat: 25.2138, lon: 75.8648 },
  "ajmer": { lat: 26.4499, lon: 74.6399 },
  "lucknow": { lat: 26.8467, lon: 80.9462 },
  "kanpur": { lat: 26.4499, lon: 80.3319 },
  "varanasi": { lat: 25.3176, lon: 82.9739 },
  "agra": { lat: 27.1767, lon: 78.0081 },
  "prayagraj": { lat: 25.4358, lon: 81.8463 },
  "allahabad": { lat: 25.4358, lon: 81.8463 },
  "meerut": { lat: 28.9845, lon: 77.7064 },
  "aligarh": { lat: 27.8974, lon: 78.0880 },
  "patna": { lat: 25.5941, lon: 85.1376 },
  "gaya": { lat: 24.7914, lon: 85.0002 },
  "muzaffarpur": { lat: 26.1209, lon: 85.3647 },
  "bhopal": { lat: 23.2599, lon: 77.4126 },
  "indore": { lat: 22.7196, lon: 75.8577 },
  "gwalior": { lat: 26.2183, lon: 78.1828 },
  "jabalpur": { lat: 23.1815, lon: 79.9864 },
  "ujjain": { lat: 23.1765, lon: 75.7885 },
  "raipur": { lat: 21.2514, lon: 81.6296 },
  "bilaspur": { lat: 22.0796, lon: 82.1391 },
  "ranchi": { lat: 23.3441, lon: 85.3096 },
  "jamshedpur": { lat: 22.8046, lon: 86.2029 },
  "dhanbad": { lat: 23.7957, lon: 86.4304 },
  "bhubaneswar": { lat: 20.2961, lon: 85.8245 },
  "cuttack": { lat: 20.4625, lon: 85.8828 },
  "rourkela": { lat: 22.2604, lon: 84.8536 },
  "chandigarh": { lat: 30.7333, lon: 76.7794 },
  "ludhiana": { lat: 30.9010, lon: 75.8573 },
  "amritsar": { lat: 31.6340, lon: 74.8723 },
  "jalandhar": { lat: 31.3260, lon: 75.5762 },
  "thiruvananthapuram": { lat: 8.5241, lon: 76.9366 },
  "trivandrum": { lat: 8.5241, lon: 76.9366 },
  "kochi": { lat: 9.9312, lon: 76.2673 },
  "kozhikode": { lat: 11.2588, lon: 75.7804 },
  "thrissur": { lat: 10.5276, lon: 76.2144 },
  "kollam": { lat: 8.8932, lon: 76.6141 },
  "visakhapatnam": { lat: 17.6868, lon: 83.2185 },
  "vijayawada": { lat: 16.5062, lon: 80.6480 },
  "tirupati": { lat: 13.6288, lon: 79.4192 },
  "guntur": { lat: 16.3067, lon: 80.4365 },
  "guwahati": { lat: 26.1445, lon: 91.7362 },
  "dehradun": { lat: 30.3165, lon: 78.0322 },
  "haridwar": { lat: 29.9457, lon: 78.1642 },
  "shimla": { lat: 31.1048, lon: 77.1734 },
  "srinagar": { lat: 34.0837, lon: 74.7973 },
  "jammu": { lat: 32.7266, lon: 74.8570 },
  "panaji": { lat: 15.4909, lon: 73.8278 },
  "panjim": { lat: 15.4909, lon: 73.8278 },
  "puducherry": { lat: 11.9416, lon: 79.8083 },
  "pondicherry": { lat: 11.9416, lon: 79.8083 },
  "port blair": { lat: 11.6234, lon: 92.7265 },
  "leh": { lat: 34.1526, lon: 77.5770 },
  "imphal": { lat: 24.8170, lon: 93.9368 },
  "shillong": { lat: 25.5788, lon: 91.8933 },
  "aizawl": { lat: 23.7271, lon: 92.7176 },
  "kohima": { lat: 25.6747, lon: 94.1086 },
  "itanagar": { lat: 27.0844, lon: 93.6053 },
  "agartala": { lat: 23.8315, lon: 91.2868 },
  "gangtok": { lat: 27.3314, lon: 88.6138 },
};

/** Look up the best available coordinates for a (city, state) pair. */
export function resolveCoords(city: string | null | undefined, state: string | null | undefined): { lat: number; lon: number } {
  if (city) {
    const key = city.trim().toLowerCase();
    if (CITY_COORDS[key]) return CITY_COORDS[key];
  }
  if (state && STATE_COORDS[state]) return STATE_COORDS[state];
  return DEFAULT_COORDS;
}