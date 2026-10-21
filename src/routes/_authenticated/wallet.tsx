import { createFileRoute } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Wallet as WalletIcon, ArrowDownCircle, ArrowUpCircle, Gift, MessageSquare } from "lucide-react";

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
  const txns = useQuery({
    queryKey: ["wallet-txns"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data } = await supabase.from("wallet_transactions")
        .select("id, kind, amount_paise, balance_after_paise, meta, created_at")
        .eq("user_id", u.user.id).order("created_at", { ascending: false }).limit(50);
      return data ?? [];
    },
  });
  const balanceInr = wallet.data ? (wallet.data.balance_paise / 100).toFixed(0) : "0";

  return (
    <main className="relative z-10 mx-auto max-w-md px-5 pb-32 pt-7 lg:pr-20 lg:pb-10">
      <h1 className="font-display text-2xl font-bold text-foreground">Wallet</h1>

      <section className="glass mt-6 rounded-3xl p-6 text-center">
        <WalletIcon className="mx-auto h-8 w-8 text-primary" />
        <div className="mt-3 text-[11px] uppercase tracking-widest text-muted-foreground">Balance</div>
        <div className="font-display mt-1 text-5xl font-bold text-primary">₹{balanceInr}</div>
        <p className="mt-2 text-xs text-muted-foreground">2 free minutes with every astrologer.</p>
      </section>

      <h2 className="font-display mt-8 text-sm font-semibold text-muted-foreground">Add money</h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {TIERS.map((t) => {
          const total = t.amount + Math.round((t.amount * t.bonus) / 100);
          return (
            <button key={t.amount} disabled className="glass relative rounded-2xl p-4 text-left opacity-90">
              {t.bonus > 0 && (
                <span className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">+{t.bonus}%</span>
              )}
              <div className="font-display text-2xl font-bold text-foreground">₹{t.amount}</div>
              <div className="text-[11px] text-muted-foreground">Get ₹{total} in wallet</div>
            </button>
          );
        })}
      </div>
      <p className="mt-4 rounded-xl border border-border bg-card/50 p-3 text-center text-xs text-muted-foreground">
        Payments launching soon. For now, your admin can credit money manually.
      </p>

      <h2 className="font-display mt-8 text-sm font-semibold text-muted-foreground">Recent activity</h2>
      <div className="mt-3 space-y-2">
        {txns.data?.length === 0 && (
          <p className="rounded-xl border border-border bg-card/50 p-4 text-center text-xs text-muted-foreground">No transactions yet.</p>
        )}
        {txns.data?.map((t) => <TxnRow key={t.id} t={t} />)}
      </div>

      <BottomNav />
    </main>
  );
}

function TxnRow({ t }: { t: { kind: string; amount_paise: number; created_at: string; meta: unknown } }) {
  const isCredit = t.amount_paise > 0;
  const Icon = t.kind === "chat_debit" ? MessageSquare : t.kind === "bonus" ? Gift : isCredit ? ArrowDownCircle : ArrowUpCircle;
  const label = ({ chat_debit: "Chat", admin_credit: "Admin credit", topup: "Top-up", bonus: "Bonus", refund: "Refund" } as Record<string, string>)[t.kind] ?? t.kind;
  const when = new Date(t.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  return (
    <div className="glass flex items-center gap-3 rounded-xl p-3 text-sm">
      <Icon className={`h-4 w-4 ${isCredit ? "text-emerald-600" : "text-rose-600"}`} />
      <div className="flex-1">
        <div className="font-medium text-foreground">{label}</div>
        <div className="text-[10px] text-muted-foreground">{when}</div>
      </div>
      <div className={`font-display font-semibold ${isCredit ? "text-emerald-600" : "text-rose-600"}`}>
        {isCredit ? "+" : ""}₹{(t.amount_paise / 100).toFixed(0)}
      </div>
    </div>
  );
}
