import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useIsAdmin } from "@/lib/profile";
import { BottomNav } from "@/components/BottomNav";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Pencil, Shield } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — AstroAura" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { data: profile } = useProfile();
  const { data: isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { mode: "signin" }, replace: true });
  }

  return (
    <main className="relative z-10 mx-auto max-w-md pl-4 pr-16 pb-10 pt-8">
      <h1 className="font-display text-2xl font-bold">Your profile</h1>

      <section className="glass mt-6 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">Name</div>
            <div className="font-display text-lg">{profile?.full_name ?? "—"}</div>
          </div>
          <Link to="/onboarding" className="flex items-center gap-1 rounded-full border border-white/15 px-3 py-1.5 text-xs">
            <Pencil className="h-3 w-3" /> Edit
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <Info label="Phone" value={profile?.phone ?? "—"} />
          <Info label="Gender" value={profile?.gender ?? "—"} />
          <Info label="State" value={profile?.state ?? "—"} />
          <Info label="City" value={profile?.city ?? "—"} />
          <Info
            label="Birth date"
            value={profile?.birth_year ? `${profile.birth_day}/${profile.birth_month}/${profile.birth_year}` : "—"}
          />
          <Info label="Birth time" value={profile?.birth_time_known ? (profile?.birth_time ?? "—") : "Unknown"} />
        </div>
      </section>

      {isAdmin && (
        <Link to="/admin" className="glass mt-4 flex items-center justify-between rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-accent" />
            <div>
              <div className="font-semibold">Admin panel</div>
              <div className="text-xs text-muted-foreground">Manage users, astrologers, payments</div>
            </div>
          </div>
          <span className="text-accent">→</span>
        </Link>
      )}

      <button
        onClick={signOut}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 py-3.5 text-sm font-medium text-destructive-foreground"
      >
        <LogOut className="h-4 w-4" /> Sign out
      </button>

      <BottomNav />
    </main>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="capitalize">{value}</div>
    </div>
  );
}