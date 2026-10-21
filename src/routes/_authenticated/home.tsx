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

const FILTERS = [
  { key: "all", label: "All", icon: "✨" },
  { key: "Love", label: "Love", icon: "❤️" },
  { key: "Career", label: "Career", icon: "💼" },
  { key: "Marriage", label: "Marriage", icon: "💍" },
  { key: "Finance", label: "Money", icon: "💰" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

function HomePage() {
  const profile = useProfile();
  const { data: isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const [streak, setStreak] = useState({ count: 0, lastDay: "" });
  const [filter, setFilter] = useState<FilterKey>("all");
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
  const all = astrologers.data ?? [];
  const filtered = filter === "all" ? all : all.filter((a) => (a.specialties ?? []).includes(filter));
  const recommended = filtered.filter((a) => a.is_recommended);
  const others = filtered.filter((a) => !a.is_recommended);

  return (
    <main className="relative z-10 mx-auto max-w-md px-5 pb-32 pt-7 space-y-6 lg:pr-24 lg:pb-16">
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <AppLogo size={38} />
          <div className="min-w-0">
            <h1 className="font-display truncate text-xl font-semibold leading-tight text-foreground">
              Namaste{profile.data?.full_name ? `, ${profile.data.full_name.split(" ")[0]}` : ""}
            </h1>
            <p className="text-xs text-muted-foreground">Choose an astrologer to start</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isAdmin && (
            <Link to="/admin" aria-label="Admin" className="glass flex items-center justify-center rounded-full p-2.5 text-primary">
              <Shield className="h-4 w-4" />
            </Link>
          )}
          <Link to="/wallet" className="glass flex items-center gap-1.5 rounded-full px-3.5 py-2.5 text-sm font-semibold text-foreground whitespace-nowrap">
            <Wallet className="h-4 w-4 text-primary" />
            ₹{balanceInr}
          </Link>
        </div>
      </header>

      <CosmicPulse />

      <section className="grid grid-cols-3 gap-3 text-center">
        <Link to="/horoscope" className="glass rounded-2xl px-2 py-5 transition hover:-translate-y-0.5 active:scale-[0.98]">
          <div className="text-2xl">☀️</div>
          <div className="font-display mt-2 text-sm font-semibold text-foreground">Horoscope</div>
          {streak.count > 0 && (
            <div className="mt-1 flex items-center justify-center gap-1 text-[11px] font-semibold text-primary">
              <Flame className="h-3 w-3" /> {streak.count}d
            </div>
          )}
        </Link>
        <Link to="/kundli" className="glass rounded-2xl px-2 py-5 transition hover:-translate-y-0.5 active:scale-[0.98]">
          <div className="text-2xl">🪐</div>
          <div className="font-display mt-2 text-sm font-semibold text-foreground">Kundli</div>
        </Link>
        <Link to="/match" className="glass rounded-2xl px-2 py-5 transition hover:-translate-y-0.5 active:scale-[0.98]">
          <div className="text-2xl">💞</div>
          <div className="font-display mt-2 text-sm font-semibold text-foreground">Matching</div>
        </Link>
      </section>

      <div>
        <h2 className="font-display mb-3 text-base font-semibold text-foreground">What do you need help with?</h2>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition active:scale-[0.97] ${
                filter === f.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card/70 text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="text-base">{f.icon}</span> {f.label}
            </button>
          ))}
        </div>
      </div>

      {astrologers.isLoading && (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-36 animate-pulse rounded-2xl bg-secondary/50" />)}
        </div>
      )}

      {recommended.length > 0 && (
        <section>
          <h2 className="font-display mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
            <span className="h-px w-5 bg-primary/40" /> Recommended for you
          </h2>
          <div className="space-y-4">
            {recommended.map((a) => <AstrologerCard key={a.id} a={a} />)}
          </div>
        </section>
      )

      {others.length > 0 && (
        <section>
          <h2 className="font-display mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <span className="h-px w-5 bg-border" /> All astrologers
          </h2>
          <div className="space-y-4">
            {others.map((a) => <AstrologerCard key={a.id} a={a} />)}
          </div>
        </section>
      )

      {astrologers.isFetched && filtered.length === 0 && (
        <div className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">
          No astrologers found for this topic. Try "All" to see everyone.
        </div>
      )}

      <BottomNav />
    </main>
  );
}
