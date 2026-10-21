import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, MessageCircle, Clock, Languages as LangIcon, BookOpen, Star } from "lucide-react";

export const Route = createFileRoute("/_authenticated/astrologer/$slug")({
  head: () => ({ meta: [{ title: "Astrologer — AstroAura" }] }),
  component: AstrologerProfile,
});

function systemLabel(s: string): string {
  const map: Record<string, string> = {
    parashara: "Vedic",
    kp: "KP",
    hellenistic: "Western",
  };
  return map[s] ?? s;
}

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

function AstrologerProfile() {
  const { slug } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["astrologer", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("astrologers").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <main className="px-6 py-10 text-center text-muted-foreground">Loading…</main>;
  if (!data) return <main className="px-6 py-10 text-center">Astrologer not found.</main>;

  const langs = (data as { languages?: string[] }).languages ?? ["English", "Hindi"];
  const systems = (data as { systems?: string[] }).systems ?? ["parashara"];
  const freeMin = (data as { free_minutes?: number }).free_minutes ?? 2;
  const specialties = (data as { specialties?: string[] }).specialties ?? [];
  const rateInr = (data.rate_paise_per_min / 100).toFixed(0);

  return (
    <main className="relative z-10 mx-auto max-w-md px-4 pb-12 pt-6">
      <Link to="/home" className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="mt-6 flex flex-col items-center text-center">
        <div className={`relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br ${data.avatar_gradient} text-5xl shadow-xl ring-1 ring-primary/20`}>
          {data.avatar_emoji}
          <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background bg-emerald-500" />
        </div>
        <h1 className="font-display mt-4 text-2xl font-bold text-foreground">{data.display_name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{data.tagline}</p>

        {data.rating && (
          <div className="mt-2 flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-primary text-primary" />
            <span className="font-semibold text-foreground">{data.rating.toFixed(1)}</span>
            <span className="text-muted-foreground">({data.reviews_count ?? 0} reviews)</span>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" /> {systems.length} system{systems.length > 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1">
            <LangIcon className="h-3 w-3" /> {langs.slice(0, 3).join(", ")}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> ₹{rateInr}/min
          </span>
        </div>

        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {systems.map((s) => (
            <span key={s} className="rounded-full border border-primary/25 bg-primary/8 px-2.5 py-0.5 text-[11px] font-medium text-primary">
              {systemLabel(s)}
            </span>
          ))}
        </div>
      </div>

      {specialties.length > 0 && (
        <section className="mt-6">
          <h2 className="font-display mb-3 text-sm font-semibold text-primary">Good for</h2>
          <div className="flex flex-wrap gap-2">
            {specialties.map((s) => (
              <span key={s} className="rounded-full border border-border bg-card/70 px-3 py-1.5 text-sm font-medium text-foreground">
                {specialtyLabel(s)}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="glass mt-6 rounded-2xl p-5">
        <h2 className="font-display text-sm font-semibold text-primary">About</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{data.bio}</p>
      </section>

      <Link
        to="/chat/$slug"
        params={{ slug }}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-semibold text-primary-foreground shadow-[0_8px_24px_-8px_oklch(0.55_0.16_48_/_0.5)] transition hover:brightness-105 active:scale-[0.98]"
      >
        <MessageCircle className="h-5 w-5" /> Start chat — {freeMin} min free
      </Link>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        After your free time, ₹{rateInr} per minute.
      </p>
    </main>
  );
}
