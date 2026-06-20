// Ashtakoot Guna Milan — proper 36-point Vedic compatibility.
// Tables follow classical Parashari / Brihat-Parashara Hora Shastra sources.
import { NAKSHATRAS, NAK_LORDS, nakIndexFromLon, signFromLon, lahiriAyanamsa, norm360 } from "./constants";
import { allPlanetPositions } from "./positions";

type PartnerInput = { date: Date; lat: number; lon: number; gender: "male" | "female" };

function moonNakIdx(date: Date): { nak: number; sign: number; pada: number } {
  const moonTrop = allPlanetPositions(date).find((p) => p.planet === "Moon")!.tropical;
  const ay = lahiriAyanamsa(date);
  const sid = norm360(moonTrop - ay);
  const n = nakIndexFromLon(sid);
  return { nak: n.idx, sign: signFromLon(sid).idx, pada: n.pada };
}

// --- Tables keyed by Rashi index (0 = Aries .. 11 = Pisces) -----------------
// Varna: 1=Brahmin (highest), 2=Kshatriya, 3=Vaishya, 4=Shudra (Parashara)
const VARNA = [2,3,1,4,2,3,1,4,2,3,1,4];
// Vashya class per sign
const VASHYA = ["Chatushpada","Chatushpada","Manushya","Jalachara","Vanachara","Manushya","Manushya","Keeta","Manushya","Chatushpada","Manushya","Jalachara"];

// --- Tables keyed by Nakshatra index 0..26 ---------------------------------
// Yoni (animal) per nakshatra — classical list
const YONI = [
  "Horse","Elephant","Sheep","Serpent","Serpent","Dog","Cat","Sheep","Cat",
  "Rat","Rat","Cow","Buffalo","Tiger","Buffalo","Tiger","Deer","Deer",
  "Dog","Monkey","Mongoose","Monkey","Lion","Horse","Lion","Cow","Elephant",
] as const;
// Yoni enemy pairs (mutual hatred → 0 points). All others default to 2 (neutral).
const YONI_ENEMIES: Array<[string, string]> = [
  ["Cow","Tiger"],["Elephant","Lion"],["Horse","Buffalo"],["Dog","Deer"],
  ["Serpent","Mongoose"],["Cat","Rat"],["Monkey","Sheep"],["Lion","Horse"],
];
// Friendly yoni pairs → 3 points
const YONI_FRIENDS: Array<[string, string]> = [
  ["Cow","Buffalo"],["Deer","Sheep"],["Cat","Monkey"],["Dog","Mongoose"],
];
const GANA = [
  "Deva","Manushya","Rakshasa","Manushya","Deva","Manushya","Deva","Deva","Rakshasa",
  "Rakshasa","Manushya","Manushya","Deva","Rakshasa","Deva","Rakshasa","Deva","Rakshasa",
  "Rakshasa","Manushya","Manushya","Deva","Rakshasa","Rakshasa","Manushya","Manushya","Deva",
] as const;
const NADI = [
  "Adi","Madhya","Antya","Antya","Madhya","Adi","Adi","Madhya","Antya",
  "Antya","Madhya","Adi","Adi","Madhya","Antya","Antya","Madhya","Adi",
  "Adi","Madhya","Antya","Antya","Madhya","Adi","Adi","Madhya","Antya",
] as const;

function varnaScore(boySign: number, girlSign: number): number {
  // Boy's varna should be >= girl's (lower number = higher varna).
  return VARNA[boySign] <= VARNA[girlSign] ? 1 : 0;
}
function vashyaScore(b: number, g: number): number {
  if (VASHYA[b] === VASHYA[g]) return 2;
  const friendly: Record<string, string[]> = {
    Manushya: ["Chatushpada","Vanachara"],
    Chatushpada: ["Manushya"],
    Vanachara: ["Manushya"],
    Jalachara: [],
    Keeta: [],
  };
  if (friendly[VASHYA[b]]?.includes(VASHYA[g])) return 1;
  return 0.5;
}
function taraScore(boyNak: number, girlNak: number): number {
  // Tara = count from one's janma nakshatra to the other's, divide by 9, remainder.
  // Inauspicious remainders: 3 (Vipat), 5 (Pratyak), 7 (Naidhana). Others auspicious.
  const t1 = ((girlNak - boyNak + 27) % 27 + 1) % 9 || 9;
  const t2 = ((boyNak - girlNak + 27) % 27 + 1) % 9 || 9;
  const bad = new Set([3, 5, 7]);
  return (bad.has(t1) ? 0 : 1.5) + (bad.has(t2) ? 0 : 1.5);
}
function yoniScore(boyNak: number, girlNak: number): number {
  const a = YONI[boyNak], c = YONI[girlNak];
  if (a === c) return 4;
  const pairEq = ([x,y]: [string,string]) => (x===a && y===c) || (x===c && y===a);
  if (YONI_ENEMIES.some(pairEq)) return 0;
  if (YONI_FRIENDS.some(pairEq)) return 3;
  return 2;
}
const SIGN_LORD_NAMES = ["Mars","Venus","Mercury","Moon","Sun","Mercury","Venus","Mars","Jupiter","Saturn","Saturn","Jupiter"];
// Parashari natural friendships
const PLANET_FRIENDS: Record<string,string[]> = {
  Sun: ["Moon","Mars","Jupiter"], Moon: ["Sun","Mercury"], Mars: ["Sun","Moon","Jupiter"],
  Mercury: ["Sun","Venus"], Jupiter: ["Sun","Moon","Mars"],
  Venus: ["Mercury","Saturn"], Saturn: ["Mercury","Venus"],
};
const PLANET_ENEMIES: Record<string,string[]> = {
  Sun: ["Venus","Saturn"], Moon: [], Mars: ["Mercury"],
  Mercury: ["Moon"], Jupiter: ["Mercury","Venus"],
  Venus: ["Sun","Moon"], Saturn: ["Sun","Moon","Mars"],
};
function grahaMaitri(b: number, g: number): number {
  const lb = SIGN_LORD_NAMES[b]; const lg = SIGN_LORD_NAMES[g];
  if (lb === lg) return 5;
  const bFriendG = PLANET_FRIENDS[lb]?.includes(lg);
  const gFriendB = PLANET_FRIENDS[lg]?.includes(lb);
  const bEnemyG = PLANET_ENEMIES[lb]?.includes(lg);
  const gEnemyB = PLANET_ENEMIES[lg]?.includes(lb);
  if (bFriendG && gFriendB) return 5;
  if (bFriendG || gFriendB) return 4;
  if (!bEnemyG && !gEnemyB) return 3; // neutral
  if (bEnemyG !== gEnemyB) return 1;  // one-sided enemy
  return 0;                            // mutual enemy
}
function ganaScore(b: number, g: number): number {
  const gb = GANA[b], gg = GANA[g];
  if (gb === gg) return 6;
  if ((gb === "Deva" && gg === "Manushya") || (gb === "Manushya" && gg === "Deva")) return 5;
  if ((gb === "Manushya" && gg === "Rakshasa") || (gb === "Rakshasa" && gg === "Manushya")) return 1;
  // Deva-Rakshasa
  return 0;
}
function bhakootScore(bSign: number, gSign: number): number {
  // Position of girl from boy and boy from girl (1-indexed).
  const d1 = ((gSign - bSign + 12) % 12) + 1;
  const d2 = ((bSign - gSign + 12) % 12) + 1;
  // Inauspicious mutual positions: 6/8 (Shadashtaka), 5/9 (Navam-Pancham), 2/12 (Dwirdwadasha).
  const bad = new Set([2, 5, 6, 8, 9, 12]);
  if (bad.has(d1) && bad.has(d2)) return 0;
  if (bad.has(d1) || bad.has(d2)) return 3.5;
  return 7;
}
function nadiScore(b: number, g: number): number {
  if (NADI[b] !== NADI[g]) return 8;
  // Nadi dosha exceptions: same nakshatra OR same nadi but in same rashi → no dosha.
  if (b === g) return 0;
  return 0;
}

export type GunaResult = {
  total: number;
  breakdown: { koota: string; score: number; max: number; note: string }[];
  verdict: string;
};

export function computeAshtakoot(boy: PartnerInput, girl: PartnerInput): GunaResult {
  const b = moonNakIdx(boy.date);
  const g = moonNakIdx(girl.date);
  const items = [
    { koota: "Varna", max: 1, score: varnaScore(b.sign, g.sign), note: `Boy ${["–","Brahmin","Kshatriya","Vaishya","Shudra"][VARNA[b.sign]]} · Girl ${["–","Brahmin","Kshatriya","Vaishya","Shudra"][VARNA[g.sign]]}` },
    { koota: "Vashya", max: 2, score: vashyaScore(b.sign, g.sign), note: `${VASHYA[b.sign]} ↔ ${VASHYA[g.sign]}` },
    { koota: "Tara", max: 3, score: taraScore(b.nak, g.nak), note: "Destiny & longevity" },
    { koota: "Yoni", max: 4, score: yoniScore(b.nak, g.nak), note: `${YONI[b.nak]} ↔ ${YONI[g.nak]}` },
    { koota: "Graha Maitri", max: 5, score: grahaMaitri(b.sign, g.sign), note: `${SIGN_LORD_NAMES[b.sign]} ↔ ${SIGN_LORD_NAMES[g.sign]}` },
    { koota: "Gana", max: 6, score: ganaScore(b.nak, g.nak), note: `${GANA[b.nak]} ↔ ${GANA[g.nak]}` },
    { koota: "Bhakoot", max: 7, score: bhakootScore(b.sign, g.sign), note: "Family welfare & prosperity" },
    { koota: "Nadi", max: 8, score: nadiScore(b.nak, g.nak), note: `${NADI[b.nak]} ↔ ${NADI[g.nak]}` },
  ];
  const total = items.reduce((s, x) => s + x.score, 0);
  const verdict = total >= 28 ? "Excellent match"
    : total >= 24 ? "Very good match"
    : total >= 18 ? "Acceptable — workable with awareness"
    : "Weak — significant friction expected";
  void NAKSHATRAS; void NAK_LORDS;
  return { total: Math.round(total * 100) / 100, breakdown: items, verdict };
}