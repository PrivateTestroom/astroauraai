import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AstrologerCard, type Astrologer } from "@/components/AstrologerCard";
import { BottomNav } from "@/components/BottomNav";
import { AppLogo } from "@/components/AppLogo";
import { useProfile, useIsAdmin } from "@/lib/profile";
import { Wallet, Shield, Flame } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CosmicLoader } from "@/components/CosmicLoader";
import { CosmicPulse } from "@/components/CosmicPulse";
import { readStreak } from "@/lib/social-proof";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({ meta: [{ title: "Astrologers — AstroAura" }] }),
  component: HomePage,
});

function HomePage() {
  const profile = useProfile();
  const { data: isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const [streak, setStreak] = useState({ count: 0, lastDay: "" });
  useEffect(() => { setStreak(readStreak()); }, []);
  const wallet = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase.from("wallet_balances").select("balance_paise").eq("user_id", u.user.id).maybeSingle();
      return data;
    },
  });

  const astrologers = useQuery({
    queryKey: ["astrologers"],
    queryFn: async (): Promise<Astrologer[]> => {
      const { data, error } = await supabase
        .from("astrologers")
        .select("id, slug, display_name, tagline, specialties, primary_system, skill_level, rate_paise_per_min, is_recommended, avatar_gradient, avatar_emoji, priority, rating, reviews_count, experience_years, languages, systems, free_minutes")
        .eq("is_active", true)
        .order("priority", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Astrologer[];
    },
  });

  useEffect(() => {
    if (profile.isFetched && (!profile.data || !profile.data.onboarded)) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [navigate, profile.data, profile.isFetched]);

  if (profile.isLoading || (profile.isFetched && (!profile.data || !profile.data.onboarded))) {
    return (
      <main className="relative z-10 mx-auto flex min-h-screen max-w-md items-center justify-center px-6">
        <CosmicLoader label="Aligning the sky…" />
      </main>
    );
  }

  const balanceInr = wallet.data ? (wallet.data.balance_paise / 100).toFixed(0) : "0";
  const recommended = astrologers.data?.filter((a) => a.is_recommended) ?? [];
  const others = astrologers.data?.filter((a) => !a.is_recommended) ?? [];

  return (
    <main className="relative z-10 mx-auto max-w-md pl-5 pr-20 pb-16 pt-10 space-y-8">
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <AppLogo size={36} />
          <div className="min-w-0">
            <h1 className="font-display truncate text-lg font-semibold leading-tight">
              Namaste{profile.data?.full_name ? `, ${profile.data.full_name.split(" ")[0]}` : ""}
            </h1>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">The sky is open</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isAdmin && (
            <Link to="/admin" aria-label="Admin" className="glass flex items-center justify-center rounded-full p-2 text-accent">
              <Shield className="h-3.5 w-3.5" />
            </Link>
          )}
          <Link to="/wallet" className="glass flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold whitespace-nowrap">
            <Wallet className="h-3.5 w-3.5 text-accent" />
            ₹{balanceInr}
          </Link>
        </div>
      </header>

      <div className="gold-divider" />

      <CosmicPulse />

      <section className="grid grid-cols-3 gap-3 text-center">
        <Link to="/horoscope" className="glass rounded-2xl px-2 py-5">
          <div className="text-2xl">☀️</div>
          <div className="font-display mt-2 text-[12px] tracking-wide">Horoscope</div>
          {streak.count > 0 && (
            <div className="mt-1.5 flex items-center justify-center gap-0.5 text-[9px] font-semibold text-accent">
              <Flame className="h-2.5 w-2.5" /> {streak.count}d streak
            </div>
          )}
        </Link>
        <Link to="/kundli" className="glass rounded-2xl px-2 py-5">
          <div className="text-2xl">🪐</div>
          <div className="font-display mt-2 text-[12px] tracking-wide">Kundli</div>
        </Link>
        <Link to="/match" className="glass rounded-2xl px-2 py-5">
          <div className="text-2xl">💞</div>
          <div className="font-display mt-2 text-[12px] tracking-wide">Matching</div>
        </Link>
      </section>

      <section className="glass overflow-hidden rounded-2xl p-6">
        <div className="text-[10px] uppercase tracking-[0.18em] text-accent">Today's sky</div>
        <h2 className="font-display mt-2 text-xl">Your daily reading</h2>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">Personalised from your chart — refreshed every morning.</p>
        <Link to="/horoscope" className="mt-4 inline-block rounded-full border border-accent/40 px-4 py-1.5 text-xs font-semibold text-accent">
          Open today →
        </Link>
      </section>

      {astrologers.isLoading && (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/3" />)}
        </div>
      )}

      {recommended.length > 0 && (
        <section>
          <h2 className="font-display mb-5 flex items-center gap-2 text-sm font-semibold text-accent">
            <span className="h-px w-6 bg-accent/40" /> Featured astrologers
          </h2>
          <div className="space-y-5">
            {recommended.map((a) => <AstrologerCard key={a.id} a={a} />)}
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section>
          <h2 className="font-display mb-5 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <span className="h-px w-6 bg-white/20" /> All astrologers
          </h2>
          <div className="space-y-5">
            {others.map((a) => <AstrologerCard key={a.id} a={a} />)}
          </div>
        </section>
      )}

      <BottomNav />
    </main>
  );
}