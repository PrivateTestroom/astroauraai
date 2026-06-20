import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/lib/profile";
import { ArrowLeft, Users, Wallet, MessageSquare, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — AstroAura" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { data: isAdmin, isLoading: roleLoading } = useIsAdmin();

  const stats = useQuery({
    enabled: !!isAdmin,
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const [{ count: users }, { count: threads }, { count: astrologers }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("chat_threads").select("*", { count: "exact", head: true }),
        supabase.from("astrologers").select("*", { count: "exact", head: true }),
      ]);
      return { users: users ?? 0, threads: threads ?? 0, astrologers: astrologers ?? 0 };
    },
  });

  if (roleLoading) return <main className="px-6 py-10 text-center text-muted-foreground">Checking access…</main>;
  if (!isAdmin) {
    throw redirect({ to: "/home" });
  }

  return (
    <main className="relative z-10 mx-auto max-w-md px-4 pb-20 pt-6">
      <Link to="/profile" className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <ArrowLeft className="h-3 w-3" /> Back
      </Link>
      <h1 className="font-display mt-4 text-3xl font-bold">Admin</h1>
      <p className="text-xs text-muted-foreground">Super admin panel. Full controls roll out in Phase 4.</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Stat icon={Users} label="Users" value={stats.data?.users} />
        <Stat icon={MessageSquare} label="Chat threads" value={stats.data?.threads} />
        <Stat icon={Sparkles} label="Astrologers" value={stats.data?.astrologers} />
        <Stat icon={Wallet} label="Revenue" value={"—"} />
      </div>

      <div className="mt-6 space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground">Phase 4 will add:</p>
        <ul className="list-disc pl-4">
          <li>User list with top spenders / most active</li>
          <li>Wallet credit / refund per user</li>
          <li>Edit astrologer rates & toggle active</li>
          <li>Full chat audit log</li>
          <li>Payment success / failure log</li>
        </ul>
      </div>
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