import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useIsAdmin } from "@/lib/profile";
import {
  adminGetStats, adminListUsers, adminCreditWallet, adminListAstrologers, adminUpdateAstrologer,
} from "@/lib/admin.functions";
import { ArrowLeft, Users, Wallet, MessageSquare, Sparkles, Plus, Settings2 } from "lucide-react";
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
    mutationFn: (v: Record<string, unknown> & { id: string }) =>
      updateAstro({ data: v as Parameters<typeof updateAstro>[0]["data"] }),
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin-astros"] });
    },
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
            <AstrologerEditor
              key={a.id}
              a={{
                id: a.id, slug: a.slug, display_name: a.display_name,
                rate_paise_per_min: a.rate_paise_per_min,
                free_minutes: (a as { free_minutes?: number }).free_minutes ?? 2,
                is_active: a.is_active, is_recommended: a.is_recommended,
                systems: ((a as { systems?: string[] }).systems ?? []) as ("parashara"|"kp"|"hellenistic")[],
                languages: (a as { languages?: string[] }).languages ?? [],
                specialties: (a as { specialties?: string[] }).specialties ?? [],
                bio: (a as { bio?: string | null }).bio ?? null,
              }}
              patch={(v) => patchAstro.mutate({ id: a.id, ...v })}
            />
          ))}
        </div>
      </section>

      <p className="mt-8 rounded-xl border border-white/10 bg-white/5 p-3 text-center text-[11px] text-muted-foreground">
        Payment gateway integration is next — you'll choose the provider.
      </p>
    </main>
  );
}

type AdminAstroRow = {
  id: string; slug: string; display_name: string;
  rate_paise_per_min: number; free_minutes: number;
  is_active: boolean; is_recommended: boolean;
  systems: string[]; languages: string[]; specialties: string[];
  bio: string | null;
};

function AstrologerEditor({ a, patch }: { a: AdminAstroRow; patch: (v: Partial<AdminAstroRow>) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass rounded-xl p-3 text-sm">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-semibold">{a.display_name}</div>
          <div className="text-[10px] text-muted-foreground">{a.slug}</div>
        </div>
        <button onClick={() => setOpen((v) => !v)} className="rounded-md bg-white/10 px-2 py-1 text-[11px]">
          <Settings2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mt-2 flex items-center gap-2 text-[11px]">
        <label className="flex items-center gap-1">₹
          <input type="number" defaultValue={a.rate_paise_per_min / 100}
            className="w-16 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-right"
            onBlur={(e) => {
              const v = Math.max(1, Number(e.target.value));
              if (v * 100 !== a.rate_paise_per_min) patch({ rate_paise_per_min: v * 100 });
            }} />/min
        </label>
        <label className="flex items-center gap-1">Free
          <input type="number" min={0} max={60} defaultValue={a.free_minutes}
            className="w-12 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-right"
            onBlur={(e) => {
              const v = Math.max(0, Math.min(60, Number(e.target.value)));
              if (v !== a.free_minutes) patch({ free_minutes: v });
            }} /> min
        </label>
        <label className="flex items-center gap-1"><input type="checkbox" defaultChecked={a.is_active}
          onChange={(e) => patch({ is_active: e.target.checked })} /> Active</label>
        <label className="flex items-center gap-1"><input type="checkbox" defaultChecked={a.is_recommended}
          onChange={(e) => patch({ is_recommended: e.target.checked })} /> Rec</label>
      </div>
      {open && (
        <div className="mt-3 space-y-2 border-t border-white/10 pt-3 text-[11px]">
          <div>
            <div className="mb-1 text-muted-foreground">Systems</div>
            <div className="flex flex-wrap gap-1.5">
              {(["parashara","kp","hellenistic"] as const).map((s) => {
                const on = a.systems?.includes(s);
                return (
                  <button key={s}
                    onClick={() => {
                      const next = on ? a.systems.filter((x) => x !== s) : [...(a.systems ?? []), s];
                      patch({ systems: next as ("parashara"|"kp"|"hellenistic")[] });
                    }}
                    className={`rounded-full px-2 py-0.5 ${on ? "bg-accent text-accent-foreground" : "bg-white/5 text-muted-foreground"}`}>
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
          <TagEditor label="Languages" tags={a.languages ?? []} onChange={(t) => patch({ languages: t })} />
          <TagEditor label="Specialties" tags={a.specialties ?? []} onChange={(t) => patch({ specialties: t })} />
          <div>
            <div className="mb-1 text-muted-foreground">Bio</div>
            <textarea defaultValue={a.bio ?? ""} rows={3}
              className="w-full rounded-md border border-white/10 bg-white/5 p-2 text-[11px]"
              onBlur={(e) => { if (e.target.value !== (a.bio ?? "")) patch({ bio: e.target.value }); }} />
          </div>
        </div>
      )}
    </div>
  );
}

function TagEditor({ label, tags, onChange }: { label: string; tags: string[]; onChange: (t: string[]) => void }) {
  const [val, setVal] = useState("");
  return (
    <div>
      <div className="mb-1 text-muted-foreground">{label}</div>
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5">
            {t}
            <button onClick={() => onChange(tags.filter((x) => x !== t))} className="text-muted-foreground">×</button>
          </span>
        ))}
        <input value={val} onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && val.trim()) {
              e.preventDefault();
              onChange([...tags, val.trim()]);
              setVal("");
            }
          }}
          placeholder="add…" className="w-20 rounded-md border border-white/10 bg-transparent px-2 py-0.5" />
      </div>
    </div>
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