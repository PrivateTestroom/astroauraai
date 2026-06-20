// Ashtakoot Guna Milan — 36-point Vedic compatibility.
import { NAKSHATRAS, NAK_LORDS, nakIndexFromLon, signFromLon, lahiriAyanamsa, norm360 } from "./constants";
import { allPlanetPositions } from "./positions";

type PartnerInput = { date: Date; lat: number; lon: number; gender: "male" | "female" };

function moonNakIdx(date: Date): { nak: number; sign: number } {
  const moonTrop = allPlanetPositions(date).find((p) => p.planet === "Moon")!.tropical;
  const ay = lahiriAyanamsa(date);
  const sid = norm360(moonTrop - ay);
  return { nak: nakIndexFromLon(sid).idx, sign: signFromLon(sid).idx };
}

// Varna table (1=Brahmin, 2=Kshatriya, 3=Vaishya, 4=Shudra) by Moon sign
const VARNA = [2,3,1,4,2,3,1,4,2,3,1,4];
const VASHYA = ["Chatushpada","Manushya","Manushya","Jalachara","Chatushpada","Manushya","Manushya","Keeta","Chatushpada","Chatushpada","Manushya","Jalachara"];
const YONI = ["Horse","Elephant","Sheep","Snake","Snake","Dog","Cat","Rat","Cow","Buffalo","Tiger","Deer","Buffalo","Tiger","Deer","Dog","Deer","Monkey","Mongoose","Monkey","Lion","Horse","Lion","Cow","Elephant","Sheep","Sheep"];
const GANA = ["Deva","Manushya","Rakshasa","Manushya","Deva","Manushya","Deva","Deva","Rakshasa","Rakshasa","Manushya","Manushya","Deva","Rakshasa","Deva","Rakshasa","Deva","Rakshasa","Rakshasa","Manushya","Manushya","Deva","Rakshasa","Rakshasa","Manushya","Manushya","Deva"];
const NADI = ["Adi","Madhya","Antya","Antya","Madhya","Adi","Adi","Madhya","Antya","Antya","Madhya","Adi","Adi","Madhya","Antya","Antya","Madhya","Adi","Adi","Madhya","Antya","Antya","Madhya","Adi","Adi","Madhya","Antya"];

function varnaScore(b: number, g: number): number { return VARNA[b] >= VARNA[g] ? 1 : 0; }
function vashyaScore(b: number, g: number): number {
  if (VASHYA[b] === VASHYA[g]) return 2;
  const friend = (a: string, c: string) => (a === "Manushya" && c === "Chatushpada") || (a === "Chatushpada" && c === "Manushya");
  if (friend(VASHYA[b], VASHYA[g])) return 1;
  return 0;
}
function taraScore(b: number, g: number): number {
  // Tara from groom's star count from bride's; remainder mod 9.
  const t1 = ((g - b + 27) % 27 + 1) % 9;
  const t2 = ((b - g + 27) % 27 + 1) % 9;
  const auspicious = [1, 3, 5, 7];
  const c1 = auspicious.includes(t1) ? 1.5 : 0;
  const c2 = auspicious.includes(t2) ? 1.5 : 0;
  return c1 + c2;
}
function yoniScore(b: number, g: number): number {
  if (YONI[b] === YONI[g]) return 4;
  return 2; // simplified neutral
}
const SIGN_LORD_NAMES = ["Mars","Venus","Mercury","Moon","Sun","Mercury","Venus","Mars","Jupiter","Saturn","Saturn","Jupiter"];
function grahaMaitri(b: number, g: number): number {
  const lb = SIGN_LORD_NAMES[b]; const lg = SIGN_LORD_NAMES[g];
  if (lb === lg) return 5;
  // friendly pairs (simplified)
  const friends: Record<string, string[]> = {
    Sun: ["Moon","Mars","Jupiter"], Moon: ["Sun","Mercury"], Mars: ["Sun","Moon","Jupiter"],
    Mercury: ["Sun","Venus"], Jupiter: ["Sun","Moon","Mars"], Venus: ["Mercury","Saturn"], Saturn: ["Mercury","Venus"],
  };
  if (friends[lb]?.includes(lg)) return 4;
  if (friends[lg]?.includes(lb)) return 3;
  return 1;
}
function ganaScore(b: number, g: number): number {
  if (GANA[b] === GANA[g]) return 6;
  if ((GANA[b] === "Deva" && GANA[g] === "Manushya") || (GANA[b] === "Manushya" && GANA[g] === "Deva")) return 5;
  if ((GANA[b] === "Manushya" && GANA[g] === "Rakshasa") || (GANA[b] === "Rakshasa" && GANA[g] === "Manushya")) return 1;
  return 0;
}
function bhakootScore(bSign: number, gSign: number): number {
  const diff1 = ((gSign - bSign + 12) % 12) + 1;
  const diff2 = ((bSign - gSign + 12) % 12) + 1;
  const bad = [2, 12, 5, 9, 6, 8];
  if (bad.includes(diff1) || bad.includes(diff2)) return 0;
  return 7;
}
function nadiScore(b: number, g: number): number { return NADI[b] === NADI[g] ? 0 : 8; }

export type GunaResult = {
  total: number;
  breakdown: { koota: string; score: number; max: number; note: string }[];
  verdict: string;
};

export function computeAshtakoot(boy: PartnerInput, girl: PartnerInput): GunaResult {
  const b = moonNakIdx(boy.date);
  const g = moonNakIdx(girl.date);
  const items = [
    { koota: "Varna", max: 1, score: varnaScore(b.sign, g.sign), note: "Spiritual compatibility" },
    { koota: "Vashya", max: 2, score: vashyaScore(b.sign, g.sign), note: "Mutual control & affection" },
    { koota: "Tara", max: 3, score: taraScore(b.nak, g.nak), note: "Destiny & well-being" },
    { koota: "Yoni", max: 4, score: yoniScore(b.nak, g.nak), note: "Physical compatibility" },
    { koota: "Graha Maitri", max: 5, score: grahaMaitri(b.sign, g.sign), note: "Mental & intellectual bond" },
    { koota: "Gana", max: 6, score: ganaScore(b.nak, g.nak), note: "Temperament" },
    { koota: "Bhakoot", max: 7, score: bhakootScore(b.sign, g.sign), note: "Family welfare & prosperity" },
    { koota: "Nadi", max: 8, score: nadiScore(b.nak, g.nak), note: "Health & progeny" },
  ];
  const total = items.reduce((s, x) => s + x.score, 0);
  const verdict = total >= 28 ? "Excellent match" : total >= 24 ? "Very good match" : total >= 18 ? "Acceptable match" : "Weak match — proceed with care";
  void NAKSHATRAS; void NAK_LORDS;
  return { total: Math.round(total * 100) / 100, breakdown: items, verdict };
}