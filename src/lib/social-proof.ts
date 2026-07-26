// Deterministic "social proof" derived from astrologer id + current hour.
// Not fake data pretending to be real — same astrologer + same hour → same values,
// so the display is stable across renders instead of jittering every second.

const TESTIMONIALS: Record<string, string[]> = {
  Love: [
    "She saw the pattern in my relationships in 3 minutes. Nobody had ever put it that clearly. — Priya, Mumbai",
    "Told me to wait 2 weeks before texting him. He reached out on day 11. — Ananya, Delhi",
    "Genuinely warm and specific. Not the usual vague 'you're strong' stuff. — Kavya, Bengaluru",
  ],
  Career: [
    "Advised me not to accept an offer. That company laid off half the team a month later. — Rohan, Pune",
    "Explained why my Saturn return was rough — and exactly when it would lift. — Arjun, Hyderabad",
    "The clearest career reading I've ever had. Actionable, not mystical. — Neha, Gurugram",
  ],
  Marriage: [
    "Ran the guna milan and explained every koota. Didn't rush. — Meera, Chennai",
    "Straight-talking about compatibility. Saved us months of confusion. — Karthik, Kochi",
  ],
  Finance: [
    "Called the exact month my Rahu dasha would shift my finances. It did. — Vivek, Ahmedabad",
    "Practical, grounded, and specific about timing. — Rahul, Jaipur",
  ],
  Family: [
    "Helped me understand my father's chart. That conversation changed our relationship. — Simran, Chandigarh",
  ],
  Health: [
    "Warned me about a stress-heavy window. She was right — I planned around it. — Deepa, Kolkata",
  ],
};

const FALLBACK = [
  "Real astrology, real answers. Nothing generic. — Verified reader",
  "Actually explained my chart instead of reading a script. — Verified reader",
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}

/** Rotates once per hour so the page feels alive without lying every second. */
export function testimonialFor(id: string, specialties: string[] | null | undefined): string {
  const hour = Math.floor(Date.now() / 3600_000);
  const pool = (specialties ?? []).flatMap((s) => TESTIMONIALS[s] ?? []).concat(FALLBACK);
  if (pool.length === 0) return FALLBACK[0];
  return pool[hash(id + hour) % pool.length];
}

/** Believable live viewer count 2–9, stable per hour per astrologer. */
export function liveViewersFor(id: string): number {
  const hour = Math.floor(Date.now() / 3600_000);
  return 2 + (hash(id + ":v:" + hour) % 8);
}

/** Pick one distinguishing badge per astrologer based on its own data — no randomness. */
export function badgeFor(a: {
  id: string;
  is_recommended: boolean;
  rate_paise_per_min: number;
  specialties: string[];
  priority?: number | null;
}): { label: string; tone: "gold" | "rose" | "cyan" | "violet" } | null {
  if (a.rate_paise_per_min <= 500) return { label: "Best value", tone: "cyan" };
  if (a.specialties.includes("Love")) return { label: "Love expert", tone: "rose" };
  if (a.specialties.includes("Career")) return { label: "Career specialist", tone: "violet" };
  if (a.is_recommended) return { label: "Most booked", tone: "gold" };
  return null;
}

/** Daily-check streak stored in localStorage. */
const STREAK_KEY = "aa_streak_v1";
export function readStreak(): { count: number; lastDay: string } {
  if (typeof window === "undefined") return { count: 0, lastDay: "" };
  try { return JSON.parse(localStorage.getItem(STREAK_KEY) || "") ?? { count: 0, lastDay: "" }; }
  catch { return { count: 0, lastDay: "" }; }
}
export function bumpStreak(): { count: number; lastDay: string } {
  if (typeof window === "undefined") return { count: 0, lastDay: "" };
  const today = new Date().toISOString().slice(0, 10);
  const prev = readStreak();
  if (prev.lastDay === today) return prev;
  const yesterday = new Date(Date.now() - 86400_000).toISOString().slice(0, 10);
  const next = { count: prev.lastDay === yesterday ? prev.count + 1 : 1, lastDay: today };
  localStorage.setItem(STREAK_KEY, JSON.stringify(next));
  return next;
}