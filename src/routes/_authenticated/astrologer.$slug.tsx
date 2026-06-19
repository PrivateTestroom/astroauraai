import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, MessageCircle, Star, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/astrologer/$slug")({
  head: () => ({ meta: [{ title: "Astrologer — AstroSage" }] }),
  component: AstrologerProfile,
});

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

  return (
    <main className="relative z-10 mx-auto max-w-md px-4 pb-12 pt-6">
      <Link to="/home" className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <ArrowLeft className="h-3 w-3" /> Back
      </Link>

      <div className="mt-6 flex flex-col items-center text-center">
        <div className={`flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br ${data.avatar_gradient} text-6xl shadow-xl ring-2 ring-white/10`}>
          {data.avatar_emoji}
        </div>
        <h1 className="font-display mt-4 text-3xl font-bold">{data.display_name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{data.tagline}</p>
        <div className="mt-3 flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1 text-accent">
            <Star className="h-3 w-3 fill-current" /> {data.skill_level}/10 skill
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" /> ₹{(data.rate_paise_per_min / 100).toFixed(0)}/min
          </span>
        </div>
      </div>

      <section className="glass mt-6 rounded-2xl p-5">
        <h2 className="font-display text-sm font-semibold text-accent">About</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{data.bio}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {(data.specialties as string[]).map((s) => (
            <span key={s} className="rounded-full bg-white/5 px-2.5 py-1 text-[11px]">{s}</span>
          ))}
        </div>
      </section>

      <button
        disabled
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-semibold text-primary-foreground shadow-[0_8px_30px_-8px_rgba(168,85,247,0.7)] disabled:opacity-70"
      >
        <MessageCircle className="h-5 w-5" /> Chat opens in Phase 2
      </button>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        Real-time streaming chat with wallet billing — coming in the next build.
      </p>
    </main>
  );
}