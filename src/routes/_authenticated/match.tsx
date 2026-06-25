import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BottomNav } from "@/components/BottomNav";
import { matchKundlis } from "@/lib/match.functions";
import { ArrowLeft, Heart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/match")({
  head: () => ({ meta: [{ title: "Match-making — AstroAura" }] }),
  component: MatchPage,
});

type Partner = { name: string; date: string; time: string; gender: "male" | "female" };
const empty = (g: "male" | "female"): Partner => ({ name: "", date: "", time: "12:00", gender: g });

function MatchPage() {
  const [boy, setBoy] = useState<Partner>(empty("male"));
  const [girl, setGirl] = useState<Partner>(empty("female"));
  const fn = useServerFn(matchKundlis);
  const m = useMutation({
    mutationFn: (v: { boy: Partner; girl: Partner }) => {
      const toIn = (p: Partner) => {
        const [y, mo, d] = p.date.split("-").map(Number);
        const [h, mi] = p.time.split(":").map(Number);
        return { name: p.name || "Unnamed", year: y, month: mo, day: d, hour: h ?? 12, minute: mi ?? 0, gender: p.gender };
      };
      return fn({ data: { boy: toIn(v.boy), girl: toIn(v.girl) } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!boy.date || !girl.date) { toast.error("Enter both birth dates"); return; }
    m.mutate({ boy, girl });
  }

  return (
    <main className="relative z-10 mx-auto max-w-md pl-4 pr-16 pb-10 pt-6">
      <Link to="/home" className="inline-flex items-center gap-1 text-xs text-muted-foreground"><ArrowLeft className="h-3 w-3" /> Back</Link>
      <h1 className="font-display mt-4 text-3xl">Match-making</h1>
      <p className="mt-1 text-xs text-muted-foreground">Ashtakoot Guna Milan · 36 points</p>

      <form onSubmit={submit} className="mt-6 grid grid-cols-2 gap-3">
        <PartnerForm title="Boy" p={boy} setP={setBoy} />
        <PartnerForm title="Girl" p={girl} setP={setGirl} />
        <button type="submit" disabled={m.isPending}
          className="col-span-2 mt-2 rounded-2xl bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-60">
          {m.isPending ? "Matching…" : "Match charts"}
        </button>
      </form>

      {m.data && (
        <section className="mt-8">
          <div className="glass rounded-2xl p-5 text-center">
            <Heart className="mx-auto h-6 w-6 text-accent" />
            <div className="font-display mt-2 text-5xl font-bold gold-text">{m.data.total}/36</div>
            <div className="mt-1 text-sm text-accent">{m.data.verdict}</div>
          </div>
          <div className="mt-4 space-y-2">
            {m.data.breakdown.map((b) => (
              <div key={b.koota} className="glass flex items-center justify-between gap-3 rounded-xl p-3 text-sm">
                <div>
                  <div className="font-semibold">{b.koota}</div>
                  <div className="text-[10px] text-muted-foreground">{b.note}</div>
                </div>
                <div className="font-display text-lg">
                  <span className="text-accent">{b.score}</span>
                  <span className="text-muted-foreground">/{b.max}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <BottomNav />
    </main>
  );
}

function PartnerForm({ title, p, setP }: { title: string; p: Partner; setP: (p: Partner) => void }) {
  return (
    <div className="glass rounded-2xl p-3">
      <div className="font-display text-sm">{title}</div>
      <input value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} placeholder="Name"
        className="input mt-2 text-sm" />
      <input type="date" value={p.date} onChange={(e) => setP({ ...p, date: e.target.value })}
        className="input mt-2 text-sm" />
      <input type="time" value={p.time} onChange={(e) => setP({ ...p, time: e.target.value })}
        className="input mt-2 text-sm" />
    </div>
  );
}