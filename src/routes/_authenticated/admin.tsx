import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useIsAdmin } from "@/lib/profile";
import {
  adminGetStats, adminListUsers, adminCreditWallet, adminListAstrologers, adminUpdateAstrologer,
} from "@/lib/admin.functions";
import { ArrowLeft, Users, Wallet, MessageSquare, Sparkles, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — AstroAura" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { data: isAdmin, isLoading: roleLoading } = useIsAdmin();
  if (roleLoading) return <main className="px-6 py-10 text-center text-muted-foreground">Checking access…</main>;
  if (!isAdmin) throw redirect({ to: "/home" });

  return <AdminBody />;
}

function AdminBody() {
  const qc = useQueryClient();
  const statsFn = useServerFn(adminGetStats);
  const usersFn = useServerFn(adminListUsers);
  const astroFn = useServerFn(adminListAstrologers);
  const creditFn = useServerFn(adminCreditWallet);
  const updateAstro = useServerFn(adminUpdateAstrologer);

  const stats = useQuery({ queryKey: ["admin-stats"], queryFn: () => statsFn({}) });
  const users = useQuery({ queryKey: ["admin-users"], queryFn: () => usersFn({}) });
  const astros = useQuery({ queryKey: ["admin-astros"], queryFn: () => astroFn({}) });

  const credit = useMutation({
    mutationFn: (v: { userId: string; amountInr: number }) => creditFn({ data: v }),
    onSuccess: () => {
      toast.success("Wallet credited");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const patchAstro = useMutation({
    mutationFn: (v: { id: string; rate_paise_per_min?: number; is_active?: boolean; is_recommended?: boolean }) =>
      updateAstro({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-astros"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <main className="relative z-10 mx-auto max-w-md px-4 pb-20 pt-6">
      <Link to="/profile" className="inline-flex items-center gap-1 text-xs text-muted-foreground"><ArrowLeft className="h-3 w-3" /> Back</Link>
      <h1 className="font-display mt-4 text-3xl font-bold">Admin</h1>
      <p className="text-xs text-muted-foreground">Manage users, wallets and astrologers.</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Stat icon={Users} label="Users" value={stats.data?.users} />
        <Stat icon={MessageSquare} label="Threads" value={stats.data?.threads} />
        <Stat icon={Sparkles} label="Messages" value={stats.data?.messages} />
        <Stat icon={Wallet} label="Revenue" value={stats.data ? `₹${stats.data.revenueInr}` : undefined} />
      </div>

      <section className="mt-8">
        <h2 className="font-display mb-3 text-sm font-semibold text-accent">Users</h2>
        <div className="space-y-2">
          {users.data?.map((u) => (
            <UserRow key={u.id} u={u} onCredit={(amt) => credit.mutate({ userId: u.id, amountInr: amt })} />
          ))}
          {users.isLoading && <p className="text-xs text-muted-foreground">Loading…</p>}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display mb-3 text-sm font-semibold text-accent">Astrologers</h2>
        <div className="space-y-2">
          {astros.data?.map((a) => (
            <div key={a.id} className="glass rounded-xl p-3 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{a.display_name}</div>
                  <div className="text-[10px] text-muted-foreground">{a.slug}</div>
                </div>
                <input
                  type="number"
                  defaultValue={a.rate_paise_per_min / 100}
                  className="w-20 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-right text-sm"
                  onBlur={(e) => {
                    const v = Math.max(1, Number(e.target.value));
                    if (v * 100 !== a.rate_paise_per_min) patchAstro.mutate({ id: a.id, rate_paise_per_min: v * 100 });
                  }}
                />
                <span className="ml-1 text-[10px] text-muted-foreground">₹/min</span>
              </div>
              <div className="mt-2 flex items-center gap-3 text-[11px]">
                <label className="flex items-center gap-1">
                  <input type="checkbox" defaultChecked={a.is_active}
                    onChange={(e) => patchAstro.mutate({ id: a.id, is_active: e.target.checked })} /> Active
                </label>
                <label className="flex items-center gap-1">
                  <input type="checkbox" defaultChecked={a.is_recommended}
                    onChange={(e) => patchAstro.mutate({ id: a.id, is_recommended: e.target.checked })} /> Recommended
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-8 rounded-xl border border-white/10 bg-white/5 p-3 text-center text-[11px] text-muted-foreground">
        Payment gateway integration is next — you'll choose the provider.
      </p>
    </main>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number | string | undefined }) {
  return (
    <div className="glass rounded-2xl p-4">
      <Icon className="h-5 w-5 text-accent" />
      <div className="font-display mt-2 text-2xl font-bold">{value ?? "—"}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

function UserRow({ u, onCredit }: { u: { id: string; full_name: string | null; phone: string | null; state: string | null; balance_paise: number }; onCredit: (amt: number) => void }) {
  const [open, setOpen] = useState(false);
  const [amt, setAmt] = useState<number>(100);
  return (
    <div className="glass rounded-xl p-3 text-sm">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <div className="truncate font-medium">{u.full_name ?? "—"}</div>
          <div className="text-[10px] text-muted-foreground">{u.phone ?? ""} · {u.state ?? ""}</div>
        </div>
        <div className="text-right">
          <div className="font-display font-bold text-accent">₹{(u.balance_paise / 100).toFixed(0)}</div>
          <button onClick={() => setOpen((v) => !v)} className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px]">
            <Plus className="h-3 w-3" /> Credit
          </button>
        </div>
      </div>
      {open && (
        <div className="mt-2 flex items-center gap-2">
          <input type="number" value={amt} onChange={(e) => setAmt(Number(e.target.value))} className="w-20 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm" />
          <button onClick={() => { onCredit(amt); setOpen(false); }} className="rounded-md bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">Credit ₹{amt}</button>
        </div>
      )}
    </div>
  );
}