import { Link } from "@tanstack/react-router";
import { Sparkles, Languages as LangIcon, Users, Quote, MessageCircle } from "lucide-react";
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
  priority?: number | null;
  rating?: number | null;
  reviews_count?: number | null;
  experience_years?: number | null;
  languages?: string[] | null;
  systems?: string[] | null;
  free_minutes?: number | null;
};

const toneClass = {
  gold: "border-primary/40 bg-primary/10 text-primary",
  rose: "border-rose-400/50 bg-rose-500/10 text-rose-700",
  cyan: "border-cyan-500/40 bg-cyan-500/10 text-cyan-700",
  violet: "border-violet-500/40 bg-violet-500/10 text-violet-700",
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
  const freeMin = a.free_minutes ?? 2;

  return (
    <Link
      to="/astrologer/$slug"
      params={{ slug: a.slug }}
      className="group glass relative flex flex-col gap-3 rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_16px_40px_-20px_oklch(0.45_0.05_55_/_0.28)] active:scale-[0.99]"
    >
      {badge && (
        <span
          className={`absolute -top-2.5 left-5 inline-flex items-center gap-1 rounded-full border bg-card px-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${toneClass[badge?.tone ?? "gold"]}`}
        >
          <Sparkles className="h-3 w-3" /> {badge.label}
        </span>
      )}

      <div className="flex items-start gap-3.5">
        <div
          className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${a.avatar_gradient} text-3xl shadow-lg ring-1 ring-primary/15`}
          aria-hidden
        >
          {a.avatar_emoji}
          <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-card bg-emerald-500" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display min-w-0 text-lg font-semibold leading-tight text-foreground">
            {a.display_name}
          </h3>
          <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-muted-foreground">{a.tagline}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(a.specialties ?? []).slice(0, 3).map((s) => (
          <span
            key={s}
            className="rounded-full border border-primary/15 bg-primary/8 px-2.5 py-1 text-[11px] font-medium text-primary"
          >
            {specialtyLabel(s)}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <LangIcon className="h-3.5 w-3.5 text-primary/60" /> {a.languages?.slice(0, 3).join(", ") ?? "English, Hindi"}
        </span>
        <span className="flex items-center gap-1">
          {systems.map(systemLabel).join(" · ")}
        </span>
      </div>

      <blockquote className="flex gap-2 border-t border-border/50 pt-3 text-[12px] italic leading-snug text-muted-foreground">
        <Quote className="h-3.5 w-3.5 shrink-0 text-primary/50" />
        <span className="line-clamp-2">{quote}</span>
      </blockquote>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <span className="font-display text-xl font-bold text-primary">₹{rateInr}</span>
            <span className="text-[11px] text-muted-foreground">/min</span>
          </div>
          {freeMin > 0 && (
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              {freeMin} min free
            </span>
          )}
        </div>
        <span className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition group-hover:brightness-105">
          <MessageCircle className="h-4 w-4" /> Chat
        </span>
      </div>

      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <Users className="h-3 w-3 text-primary/50" /> {viewers} people reading now
      </div>
    </Link>
  );
}
