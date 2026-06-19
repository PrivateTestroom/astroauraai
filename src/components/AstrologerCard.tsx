import { Link } from "@tanstack/react-router";
import { Star, Sparkles } from "lucide-react";

export type Astrologer = {
  id: string;
  slug: string;
  display_name: string;
  tagline: string | null;
  specialties: string[];
  primary_system: string;
  skill_level: number;
  rate_paise_per_min: number;
  is_recommended: boolean;
  avatar_gradient: string;
  avatar_emoji: string;
};

export function AstrologerCard({ a }: { a: Astrologer }) {
  const rateInr = (a.rate_paise_per_min / 100).toFixed(0);
  return (
    <Link
      to="/astrologer/$slug"
      params={{ slug: a.slug }}
      className="group glass relative flex items-center gap-4 rounded-2xl p-4 transition hover:-translate-y-0.5 hover:shadow-[0_8px_40px_-10px_rgba(168,85,247,0.45)]"
    >
      {a.is_recommended && (
        <span className="absolute -top-2 left-4 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground shadow">
          <Sparkles className="h-3 w-3" /> Recommended
        </span>
      )}
      <div
        className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${a.avatar_gradient} text-3xl shadow-lg ring-2 ring-white/10`}
        aria-hidden
      >
        {a.avatar_emoji}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-display truncate text-lg font-semibold">{a.display_name}</h3>
          <span className="flex items-center gap-0.5 text-xs text-accent">
            <Star className="h-3 w-3 fill-current" /> {a.skill_level}/10
          </span>
        </div>
        <p className="truncate text-xs text-muted-foreground">{a.tagline}</p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {a.specialties.slice(0, 3).map((s) => (
            <span key={s} className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground">
              {s}
            </span>
          ))}
        </div>
      </div>
      <div className="text-right">
        <div className="font-display text-xl font-bold text-accent">₹{rateInr}</div>
        <div className="text-[10px] text-muted-foreground">/ min</div>
      </div>
    </Link>
  );
}