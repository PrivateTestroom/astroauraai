// Rider–Waite–Smith Major Arcana (Pamela Coleman Smith, 1909 — public domain).
// Card scans hosted on Wikimedia Commons (the original 1909 plates).
export type TarotCard = {
  id: number;
  num: string; // roman numeral
  name: string;
  image: string;
  keywords: string[];
  upright: string;
  reversed: string;
};

// Wikimedia Special:FilePath resolves to the actual high-res scan and follows redirects in <img>.
const IMG = (n: number, slug: string) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/RWS_Tarot_${n.toString().padStart(2, "0")}_${slug}.jpg?width=600`;

export const MAJOR_ARCANA: TarotCard[] = [
  { id: 0,  num: "0",     name: "The Fool",            image: IMG(0,  "Fool"),             keywords: ["beginnings","innocence","leap of faith"], upright: "A fresh chapter, spontaneity, trusting the unknown.", reversed: "Recklessness, hesitation, fear of starting." },
  { id: 1,  num: "I",     name: "The Magician",        image: IMG(1,  "Magician"),         keywords: ["will","manifestation","skill"], upright: "You have every tool you need — act with intention.", reversed: "Manipulation, scattered focus, untapped talent." },
  { id: 2,  num: "II",    name: "The High Priestess",  image: IMG(2,  "High_Priestess"),   keywords: ["intuition","mystery","inner voice"], upright: "Listen inward; the answer is already known to you.", reversed: "Secrets, ignored intuition, surface noise." },
  { id: 3,  num: "III",   name: "The Empress",         image: IMG(3,  "Empress"),          keywords: ["abundance","nurturing","creativity"], upright: "Fertility of ideas, comfort, sensuous growth.", reversed: "Creative block, dependence, neglected self-care." },
  { id: 4,  num: "IV",    name: "The Emperor",         image: IMG(4,  "Emperor"),          keywords: ["structure","authority","stability"], upright: "Take command, build the framework.", reversed: "Rigidity, control issues, weak leadership." },
  { id: 5,  num: "V",     name: "The Hierophant",      image: IMG(5,  "Hierophant"),       keywords: ["tradition","mentorship","values"], upright: "A teacher, a tested path, sacred study.", reversed: "Breaking convention, dogma, lost faith." },
  { id: 6,  num: "VI",    name: "The Lovers",          image: IMG(6,  "Lovers"),           keywords: ["union","choice","alignment"], upright: "A meaningful bond or values-aligned choice.", reversed: "Disharmony, misaligned values, indecision." },
  { id: 7,  num: "VII",   name: "The Chariot",         image: IMG(7,  "Chariot"),          keywords: ["willpower","drive","victory"], upright: "Discipline carries you through — hold the reins.", reversed: "Scattered direction, aggression, stalling." },
  { id: 8,  num: "VIII",  name: "Strength",            image: IMG(8,  "Strength"),         keywords: ["courage","gentleness","mastery"], upright: "Quiet courage tames the fiercest situation.", reversed: "Self-doubt, suppressed power, frustration." },
  { id: 9,  num: "IX",    name: "The Hermit",          image: IMG(9,  "Hermit"),           keywords: ["solitude","reflection","guidance"], upright: "Withdraw to find the lantern of inner wisdom.", reversed: "Isolation, withdrawal, refusing counsel." },
  { id: 10, num: "X",     name: "Wheel of Fortune",    image: IMG(10, "Wheel_of_Fortune"), keywords: ["cycles","destiny","turning point"], upright: "A turning of fate — ride the change.", reversed: "Resistance to change, bad luck cycle." },
  { id: 11, num: "XI",    name: "Justice",             image: IMG(11, "Justice"),          keywords: ["truth","balance","karma"], upright: "Fair outcome, accountability, clarity of cause and effect.", reversed: "Unfairness, avoidance, dishonesty catching up." },
  { id: 12, num: "XII",   name: "The Hanged Man",      image: IMG(12, "Hanged_Man"),       keywords: ["surrender","new perspective","pause"], upright: "Suspended action reveals a fresh angle.", reversed: "Stalling, martyrdom, stuck viewpoint." },
  { id: 13, num: "XIII",  name: "Death",               image: IMG(13, "Death"),            keywords: ["endings","transformation","release"], upright: "A necessary ending clears the way for rebirth.", reversed: "Resistance to change, lingering attachments." },
  { id: 14, num: "XIV",   name: "Temperance",          image: IMG(14, "Temperance"),       keywords: ["balance","patience","blending"], upright: "Mix opposites with patience for the right alchemy.", reversed: "Excess, impatience, imbalance." },
  { id: 15, num: "XV",    name: "The Devil",           image: IMG(15, "Devil"),            keywords: ["attachment","shadow","bondage"], upright: "An unhealthy attachment or pattern has its hooks in.", reversed: "Breaking chains, reclaiming power." },
  { id: 16, num: "XVI",   name: "The Tower",           image: IMG(16, "Tower"),            keywords: ["upheaval","revelation","collapse"], upright: "Sudden shake-up clears a false foundation.", reversed: "Averted disaster, fear of change, delay of the inevitable." },
  { id: 17, num: "XVII",  name: "The Star",            image: IMG(17, "Star"),             keywords: ["hope","healing","renewal"], upright: "Quiet hope returns — you are guided and seen.", reversed: "Despair, disconnection, lost faith." },
  { id: 18, num: "XVIII", name: "The Moon",            image: IMG(18, "Moon"),             keywords: ["illusion","intuition","uncertainty"], upright: "Things aren't as they seem — trust the dream's clue.", reversed: "Truth emerging, confusion lifting." },
  { id: 19, num: "XIX",   name: "The Sun",             image: IMG(19, "Sun"),              keywords: ["joy","success","vitality"], upright: "Warmth, clarity, deserved success.", reversed: "Temporary clouds, dimmed enthusiasm." },
  { id: 20, num: "XX",    name: "Judgement",           image: IMG(20, "Judgement"),        keywords: ["awakening","calling","reckoning"], upright: "A call you cannot ignore — answer it.", reversed: "Self-doubt, ignored calling, harsh self-judgment." },
  { id: 21, num: "XXI",   name: "The World",           image: IMG(21, "World"),            keywords: ["completion","wholeness","integration"], upright: "A cycle completes — wholeness and accomplishment.", reversed: "Loose ends, incomplete closure, almost there." },
];

// Fisher–Yates with a real cryptographic source
export function shuffleDeck<T>(deck: T[]): T[] {
  const out = deck.slice();
  const rand = new Uint32Array(out.length);
  crypto.getRandomValues(rand);
  for (let i = out.length - 1; i > 0; i--) {
    const j = rand[i] % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// 50/50 reversed per traditional RWS practice
export function maybeReversed(): boolean {
  const r = new Uint32Array(1);
  crypto.getRandomValues(r);
  return (r[0] & 1) === 1;
}

export const SPREAD_POSITIONS = ["Past", "Present", "Future"] as const;
export type SpreadPosition = (typeof SPREAD_POSITIONS)[number];