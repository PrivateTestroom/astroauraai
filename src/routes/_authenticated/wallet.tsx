import { createFileRoute } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Wallet as WalletIcon } from "lucide-react";

const TIERS = [
  { amount: 10, bonus: 0 },
  { amount: 50, bonus: 50 },
  { amount: 100, bonus: 50 },
  { amount: 500, bonus: 100 },
  { amount: 1000, bonus: 100 },
  { amount: 3000, bonus: 100 },
];

export const Route = createFileRoute("/_authenticated/wallet")({
  head: () => ({ meta: [{ title: "Wallet — AstroAura" }] }),
  component: WalletPage,
});

function WalletPage() {
  const wallet = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase.from("wallet_balances").select("balance_paise").eq("user_id", u.user.id).maybeSingle();
      return data;
    },
  });
  const balanceInr = wallet.data ? (wallet.data.balance_paise / 100).toFixed(0) : "0";

  return (
    <main className="relative z-10 mx-auto max-w-md px-4 pb-28 pt-8">
      <h1 className="font-display text-2xl font-bold">Wallet</h1>

      <section className="glass mt-6 rounded-3xl p-6 text-center">
        <WalletIcon className="mx-auto h-8 w-8 text-accent" />
        <div className="mt-3 text-[11px] uppercase tracking-widest text-muted-foreground">Balance</div>
        <div className="font-display mt-1 text-5xl font-bold text-accent">₹{balanceInr}</div>
        <p className="mt-2 text-xs text-muted-foreground">1 minute free with every astrologer.</p>
      </section>

      <h2 className="font-display mt-8 text-sm font-semibold text-muted-foreground">Add money</h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {TIERS.map((t) => {
          const total = t.amount + Math.round((t.amount * t.bonus) / 100);
          return (
            <button
              key={t.amount}
              disabled
              className="glass relative rounded-2xl p-4 text-left opacity-90"
            >
              {t.bonus > 0 && (
                <span className="absolute right-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                  +{t.bonus}%
                </span>
              )}
              <div className="font-display text-2xl font-bold">₹{t.amount}</div>
              <div className="text-[11px] text-muted-foreground">
                Get ₹{total} in wallet
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-center text-xs text-muted-foreground">
        Payments are launching soon. For now, your admin can credit money manually.
      </p>

      <BottomNav />
    </main>
  );
}