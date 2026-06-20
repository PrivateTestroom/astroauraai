import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AstrologerCard, type Astrologer } from "@/components/AstrologerCard";
import { BottomNav } from "@/components/BottomNav";
import { AppLogo } from "@/components/AppLogo";
import { useProfile } from "@/lib/profile";
import { Wallet } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({ meta: [{ title: "Astrologers — AstroAura" }] }),
  component: HomePage,
});

function HomePage() {
  const profile = useProfile();
  const navigate = useNavigate();
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
        .select("id, slug, display_name, tagline, specialties, primary_system, skill_level, rate_paise_per_min, is_recommended, avatar_gradient, avatar_emoji, priority")
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
      <main className="relative z-10 mx-auto flex min-h-screen max-w-md items-center justify-center px-6 text-center text-sm text-muted-foreground">
        Preparing your chart…
      </main>
    );
  }

  const balanceInr = wallet.data ? (wallet.data.balance_paise / 100).toFixed(0) : "0";
  const recommended = astrologers.data?.filter((a) => a.is_recommended) ?? [];
  const others = astrologers.data?.filter((a) => !a.is_recommended) ?? [];

  return (
    <main className="relative z-10 mx-auto max-w-md px-4 pb-28 pt-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AppLogo size={36} />
          <div>
            <h1 className="font-display text-lg font-semibold leading-tight">
              Namaste{profile.data?.full_name ? `, ${profile.data.full_name.split(" ")[0]}` : ""}
            </h1>
            <p className="text-[11px] text-muted-foreground">The stars are listening.</p>
          </div>
        </div>
        <Link to="/wallet" className="glass flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold">
          <Wallet className="h-3.5 w-3.5 text-accent" />
          ₹{balanceInr}
        </Link>
      </header>

      <section className="glass mt-6 overflow-hidden rounded-2xl p-5">
        <div className="text-[10px] uppercase tracking-widest text-accent">Today’s sky</div>
        <h2 className="font-display mt-1 text-xl font-semibold">Your daily horoscope</h2>
        <p className="mt-1 text-xs text-muted-foreground">Personalized to your chart — tap to read.</p>
        <Link to="/horoscope" className="mt-3 inline-block rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-accent-foreground">
          Open today →
        </Link>
      </section>

      {astrologers.isLoading && (
        <div className="mt-8 grid gap-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/5" />)}
        </div>
      )}

      {recommended.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display mb-3 text-sm font-semibold text-accent">⭐ Recommended for you</h2>
          <div className="space-y-3">
            {recommended.map((a) => <AstrologerCard key={a.id} a={a} />)}
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display mb-3 text-sm font-semibold text-muted-foreground">All astrologers</h2>
          <div className="space-y-3">
            {others.map((a) => <AstrologerCard key={a.id} a={a} />)}
          </div>
        </section>
      )}

      <BottomNav />
    </main>
  );
}