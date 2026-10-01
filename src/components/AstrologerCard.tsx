import { Link } from "@tanstack/react-router";
import { Sparkles, Languages as LangIcon, Users, Quote } from "lucide-react";
import { badgeFor, liveViewersFor, testimonialFor } from "@/lib/social-proof";

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
  const badge = badgeFor(a);
  const viewers = liveViewersFor(a.id);
  const quote = testimonialFor(a.id, a.specialties);
  const toneClass = {
    gold: "border-accent/45 bg-accent/10 text-accent",
    rose: "border-rose-400/40 bg-rose-500/10 text-rose-200",
    cyan: "border-cyan-400/40 bg-cyan-500/10 text-cyan-200",
    violet: "border-violet-400/40 bg-violet-500/10 text-violet-200",
  }[badge?.tone ?? "gold"];
  return (
    <Link
      to="/astrologer/$slug"
      params={{ slug: a.slug }}
      className="group glass relative flex flex-col gap-3 rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-accent/40"
    >
      {badge && (
        <span className={`absolute -top-2 left-4 inline-flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] ${toneClass}`}>
          <Sparkles className="h-2.5 w-2.5" /> {badge.label}
        </span>
      )}
      <div className="flex items-start gap-3 sm:gap-4">
        <div
          className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${a.avatar_gradient} text-2xl shadow-lg ring-1 ring-accent/20 sm:h-16 sm:w-16 sm:text-3xl`}
          aria-hidden
        >
          {a.avatar_emoji}
          <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-background bg-emerald-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display min-w-0 text-base font-semibold leading-tight sm:text-lg">{a.display_name}</h3>
            <div className="shrink-0 text-right">
              <div className="font-display text-lg font-bold leading-none gold-text sm:text-xl">₹{rateInr}</div>
              <div className="text-[10px] text-muted-foreground">/ min</div>
            </div>
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground/90">{a.tagline}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            {a.languages?.length ? (
              <span className="flex items-center gap-1 text-[10.5px] text-muted-foreground">
                <LangIcon className="h-3 w-3" /> {a.languages.slice(0, 3).join(" · ")}
              </span>
            ) : null}
            {(a.free_minutes ?? 2) > 0 && (
              <span className="rounded-full border border-accent/30 px-1.5 py-0.5 text-[9px] font-semibold text-accent">
                {a.free_minutes ?? 2}m free
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {(a.specialties ?? []).slice(0, 3).map((s) => (
          <span key={s} className="rounded-full border border-accent/15 bg-accent/5 px-2 py-0.5 text-[10px] text-accent/90">
            {s}
          </span>
        ))}
      </div>


      <blockquote className="flex gap-1.5 border-t border-white/5 pt-2.5 text-[11px] italic leading-snug text-muted-foreground/85">
        <Quote className="h-3 w-3 shrink-0 text-accent/60" />
        <span className="line-clamp-2">{quote}</span>
      </blockquote>

      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><Users className="h-3 w-3 text-accent/70" /> {viewers} people reading right now</span>
        <span className="font-semibold text-accent">Talk now →</span>
      </div>
    </Link>
  );
}