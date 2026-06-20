import { Link } from "@tanstack/react-router";
import { Star, Sparkles, Languages as LangIcon } from "lucide-react";

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
  rating?: number | null;
  reviews_count?: number | null;
  experience_years?: number | null;
  languages?: string[] | null;
  systems?: string[] | null;
  free_minutes?: number | null;
};

export function AstrologerCard({ a }: { a: Astrologer }) {
  const rateInr = (a.rate_paise_per_min / 100).toFixed(0);
  const rating = a.rating ?? 4.7;
  return (
    <Link
      to="/astrologer/$slug"
      params={{ slug: a.slug }}
      className="group glass relative flex items-center gap-4 rounded-2xl p-4 transition hover:-translate-y-0.5 hover:border-accent/40"
    >
      {a.is_recommended && (
        <span className="absolute -top-2 left-4 inline-flex items-center gap-1 rounded-full border border-accent/40 bg-background px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-accent">
          <Sparkles className="h-2.5 w-2.5" /> Featured
        </span>
      )}
      <div
        className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${a.avatar_gradient} text-3xl shadow-lg ring-1 ring-accent/20`}
        aria-hidden
      >
        {a.avatar_emoji}
        <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-background bg-emerald-400" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-display truncate text-lg font-semibold">{a.display_name}</h3>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[10.5px] text-muted-foreground">
          <span className="flex items-center gap-0.5 text-accent">
            <Star className="h-3 w-3 fill-current" /> {rating.toFixed(1)}
          </span>
          {a.experience_years ? <span>· {a.experience_years} yrs</span> : null}
          {a.languages?.length ? (
            <span className="flex items-center gap-0.5"><LangIcon className="h-3 w-3" /> {a.languages.slice(0,2).join(", ")}</span>
          ) : null}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground/80">{a.tagline}</p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {(a.specialties ?? []).slice(0, 3).map((s) => (
            <span key={s} className="rounded-full border border-white/8 bg-white/3 px-2 py-0.5 text-[10px] text-muted-foreground">
              {s}
            </span>
          ))}
        </div>
      </div>
      <div className="text-right">
        <div className="font-display text-xl font-bold gold-text">₹{rateInr}</div>
        <div className="text-[10px] text-muted-foreground">/ min</div>
        {(a.free_minutes ?? 2) > 0 && (
          <div className="mt-1 rounded-full border border-accent/30 px-1.5 py-0.5 text-[9px] font-semibold text-accent">
            {a.free_minutes ?? 2}m free
          </div>
        )}
      </div>
    </Link>
  );
}