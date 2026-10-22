import { Link } from "@tanstack/react-router";
import { Sparkles, Languages as LangIcon, Users, Quote, Star } from "lucide-react";
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

const toneClass = {
  gold: "border-primary/45 bg-primary/10 text-primary",
  rose: "border-rose-400/50 bg-rose-500/10 text-rose-700",
  cyan: "border-cyan-500/45 bg-cyan-500/10 text-cyan-700",
  violet: "border-violet-500/45 bg-violet-500/10 text-violet-700",
};

function specialtyLabel(s: string): string {
  const map: Record<string, string> = {
    Love: "Love & Relationships",
    Career: "Career & Work",
    Marriage: "Marriage",
    Finance: "Money & Finance",
    Family: "Family",
    Health: "Health",
  };
  return map[s] ?? s;
}

function systemLabel(s: string): string {
  const map: Record<string, string> = {
    parashara: "Vedic",
    kp: "KP",
    hellenistic: "Western",
  };
  return map[s] ?? s;
}

export function AstrologerCard({ a }: { a: Astrologer }) {
  const rateInr = (a.rate_paise_per_min / 100).toFixed(0);
  const badge = badgeFor(a);
  const viewers = liveViewersFor(a.id);
  const quote = testimonialFor(a.id, a.specialties);
  const systems = a.systems ?? [a.primary_system];

  return (
    <Link
      to="/astrologer/$slug"
      params={{ slug: a.slug }}
      className="group glass relative flex flex-col gap-3 rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-primary/40"
    >
      {badge && (
        <span
          className={`absolute -top-2 left-4 inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
            toneClass[badge?.tone ?? "gold"]
          }`}
        >
          <Sparkles className="h-3 w-3" /> {badge.label}
        </span>
      )}
      <div className="flex items-start gap-3 sm:gap-4">
        <div
          className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${a.avatar_gradient} text-3xl shadow-lg ring-1 ring-primary/20 sm:h-18 sm:w-18 sm:text-3xl`}
          aria-hidden
        >
          {a.avatar_emoji}
          <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-card bg-emerald-500" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display min-w-0 text-lg font-semibold leading-tight text-foreground sm:text-xl">
              {a.display_name}
            </h3>
            <div className="shrink-0 text-right">
              <div className="font-display text-xl font-bold leading-none text-primary sm:text-2xl">₹{rateInr}</div>
              <div className="text-[11px] text-muted-foreground">/ min</div>
            </div>
          </div>
          {a.rating != null && (
            <div className="mt-0.5 flex items-center gap-1 text-[11px]">
              <Star className="h-3 w-3 fill-primary text-primary" />
              <span className="font-semibold text-foreground">{a.rating.toFixed(1)}</span>
              <span className="text-muted-foreground">({a.reviews_count ?? 0})</span>
              <span className="text-muted-foreground">· {a.experience_years ?? 5}yr exp</span>
            </div>
          )}
          <p className="mt-1 line-clamp-2 text-sm leading-snug text-muted-foreground">{a.tagline}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            {a.languages?.length ? (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <LangIcon className="h-3.5 w-3.5" /> {a.languages.slice(0, 3).join(" · ")}
              </span>
            ) : null}
            {(a.free_minutes ?? 2) > 0 && (
              <span className="rounded-full border border-primary/35 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                {a.free_minutes ?? 2}m free
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(a.specialties ?? []).slice(0, 3).map((s) => (
          <span
            key={s}
            className="rounded-full border border-primary/20 bg-primary/8 px-2.5 py-0.5 text-[11px] font-medium text-primary"
          >
            {specialtyLabel(s)}
          </span>
        ))}
        {systems.map((s) => (
          <span
            key={s}
            className="rounded-full border border-border bg-card/60 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
          >
            {systemLabel(s)}
          </span>
        ))}
      </div>

      <blockquote className="flex gap-2 border-t border-border/60 pt-3 text-[13px] italic leading-snug text-muted-foreground">
        <Quote className="h-3.5 w-3.5 shrink-0 text-primary/60" />
        <span className="line-clamp-2">{quote}</span>
      </blockquote>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5 text-primary/70" /> {viewers} reading now
        </span>
        <span className="rounded-full bg-primary px-3.5 py-1.5 text-[11px] font-semibold text-primary-foreground transition group-hover:brightness-105">
          Talk now →
        </span>
      </div>
    </Link>
  );
}
