import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import ReactMarkdown from "react-markdown";
import { Sparkles, RotateCcw, Shuffle } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { CosmicLoader } from "@/components/CosmicLoader";
import { MAJOR_ARCANA, shuffleDeck, maybeReversed, SPREAD_POSITIONS, type TarotCard } from "@/lib/tarot/deck";
import { interpretTarot } from "@/lib/tarot.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tarot")({
  head: () => ({ meta: [
    { title: "Tarot Reading — AstroAura" },
    { name: "description", content: "Real Rider-Waite-Smith three-card tarot spread. Shuffle, pick three cards, and receive a Past–Present–Future reading." },
  ]}),
  component: TarotPage,
});

const TABLE_SIZE = 14; // cards laid face-down for the seeker to pick from

type Pick = { cardId: number; position: "Past" | "Present" | "Future"; reversed: boolean; tableIndex: number };
type Phase = "intro" | "shuffling" | "picking" | "revealed";

function TarotPage() {
  const [question, setQuestion] = useState("");
  const [phase, setPhase] = useState<Phase>("intro");
  const [table, setTable] = useState<TarotCard[]>([]);
  const [reversed, setReversed] = useState<boolean[]>([]);
  const [picks, setPicks] = useState<Pick[]>([]);
  const interpret = useServerFn(interpretTarot);

  const readingMutation = useMutation({
    mutationFn: (p: Pick[]) => interpret({ data: { question, picks: p.map(({ cardId, position, reversed }) => ({ cardId, position, reversed })) } }),
    onSuccess: () => setPhase("revealed"),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Reading failed"),
  });

  function beginShuffle() {
    setPhase("shuffling");
    setPicks([]);
    setTimeout(() => {
      const shuffled = shuffleDeck(MAJOR_ARCANA).slice(0, TABLE_SIZE);
      setTable(shuffled);
      setReversed(shuffled.map(() => maybeReversed()));
      setPhase("picking");
    }, 1400);
  }

  function pickCard(tableIndex: number) {
    if (picks.length >= 3 || picks.find((p) => p.tableIndex === tableIndex)) return;
    const card = table[tableIndex];
    const position = SPREAD_POSITIONS[picks.length];
    const next: Pick[] = [...picks, { cardId: card.id, position, reversed: reversed[tableIndex], tableIndex }];
    setPicks(next);
    if (next.length === 3) readingMutation.mutate(next);
  }

  function reset() {
    setPhase("intro");
    setPicks([]);
    setTable([]);
    readingMutation.reset();
  }

  return (
    <main className="relative z-10 mx-auto min-h-[100dvh] max-w-md px-5 pb-32 pt-6">
      <header className="mb-5">
        <p className="text-[11px] uppercase tracking-[0.3em] text-accent">Rider-Waite Tarot</p>
        <h1 className="font-display text-3xl font-semibold leading-tight">Three-Card Spread</h1>
        <p className="mt-1 text-sm text-muted-foreground">Past · Present · Future. A real deck, shuffled the moment you ask.</p>
      </header>

      {phase === "intro" && (
        <section className="space-y-4 animate-fade-in">
          <div className="glass rounded-2xl p-5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-accent">Your question</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="What truly serves me in love right now? Should I take the new job? …"
              className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-accent/50"
            />
            <p className="mt-2 text-[11px] text-muted-foreground">A specific question gives a sharper reading. Leave blank for an open reading.</p>
          </div>

          <button onClick={beginShuffle} className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-accent via-amber-500 to-orange-600 px-6 py-4 text-base font-semibold text-black shadow-[0_10px_30px_-10px_rgba(245,197,24,0.6)] transition active:scale-[0.98]">
            <span className="relative z-10 flex items-center justify-center gap-2"><Shuffle className="h-5 w-5" /> Shuffle the deck</span>
          </button>

          <div className="glass rounded-2xl p-4 text-xs leading-relaxed text-muted-foreground">
            The deck uses all 22 Major Arcana — the soul cards of the tarot. Each shuffle uses true randomness from your device's secure RNG, with every card given an equal chance of appearing reversed, exactly as a reader would draw at the table.
          </div>
        </section>
      )}

      {phase === "shuffling" && (
        <section className="flex flex-col items-center justify-center py-12">
          <ShufflingDeck />
          <p className="mt-6 text-sm text-muted-foreground">Shuffling and cutting the deck…</p>
        </section>
      )}

      {(phase === "picking" || (phase === "revealed" && !readingMutation.data)) && (
        <section className="animate-fade-in">
          <div className="glass mb-4 flex items-center justify-between rounded-2xl p-3 text-xs">
            <span className="text-muted-foreground">Choose <span className="font-bold text-accent">{3 - picks.length}</span> more card{3 - picks.length === 1 ? "" : "s"}</span>
            <div className="flex gap-1">
              {SPREAD_POSITIONS.map((p, i) => (
                <span key={p} className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${i < picks.length ? "border-accent/40 bg-accent/15 text-accent" : "border-white/10 text-muted-foreground"}`}>{p}</span>
              ))}
            </div>
          </div>

          <CardFan table={table} picks={picks} onPick={pickCard} />

          {readingMutation.isPending && (
            <div className="mt-8"><CosmicLoader label="Reading the cards…" /></div>
          )}
        </section>
      )}

      {phase === "revealed" && readingMutation.data && (
        <section className="animate-fade-in space-y-5">
          <div className="grid grid-cols-3 gap-2">
            {readingMutation.data.cards.map(({ card, position, reversed }) => (
              <div key={position} className="flex flex-col items-center">
                <span className="mb-1 text-[10px] uppercase tracking-wider text-accent">{position}</span>
                <TarotCardArt card={card} reversed={reversed} small />
                <span className="mt-1 text-center text-[10px] leading-tight text-muted-foreground">{card.name}{reversed && " ⤵"}</span>
              </div>
            ))}
          </div>

          <article className="glass rounded-2xl p-5 text-sm leading-relaxed">
            <div className="mb-3 flex items-center gap-2 text-accent"><Sparkles className="h-4 w-4" /><span className="font-display text-base text-foreground">Your reading</span></div>
            <div className="prose prose-sm prose-invert max-w-none [&_p]:my-2 [&_strong]:text-accent">
              <ReactMarkdown>{readingMutation.data.reading}</ReactMarkdown>
            </div>
          </article>

          <button onClick={reset} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold">
            <RotateCcw className="h-4 w-4" /> Draw another spread
          </button>
        </section>
      )}

      <BottomNav />
    </main>
  );
}

function ShufflingDeck() {
  return (
    <div className="relative h-44 w-32">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="absolute inset-0 rounded-xl"
          style={{
            animation: `tarot-shuffle 1.2s ${i * 80}ms ease-in-out infinite`,
          }}
        >
          <CardBack />
        </div>
      ))}
      <style>{`
        @keyframes tarot-shuffle {
          0%   { transform: translate(0,0) rotate(0deg); }
          25%  { transform: translate(-30px,-6px) rotate(-12deg); }
          50%  { transform: translate(0,4px) rotate(2deg); }
          75%  { transform: translate(30px,-6px) rotate(12deg); }
          100% { transform: translate(0,0) rotate(0deg); }
        }
      `}</style>
    </div>
  );
}

function CardFan({ table, picks, onPick }: { table: TarotCard[]; picks: Pick[]; onPick: (i: number) => void }) {
  const count = table.length;
  // Lay cards out in an arc
  const layout = useMemo(() => {
    const spread = 70; // total arc degrees
    const start = -spread / 2;
    const step = spread / Math.max(1, count - 1);
    return table.map((_, i) => {
      const angle = start + step * i;
      const x = Math.sin((angle * Math.PI) / 180) * 110;
      const y = (1 - Math.cos((angle * Math.PI) / 180)) * 60;
      return { angle, x, y };
    });
  }, [table, count]);

  return (
    <div className="relative mx-auto h-72 w-full">
      {table.map((card, i) => {
        const pick = picks.find((p) => p.tableIndex === i);
        const { angle, x, y } = layout[i];
        const lifted = !!pick;
        return (
          <button
            key={i}
            onClick={() => onPick(i)}
            disabled={lifted || picks.length >= 3}
            className="absolute left-1/2 top-6 transition-transform duration-500 ease-out hover:-translate-y-3 active:scale-95 disabled:cursor-default"
            style={{
              transform: `translateX(${x - 36}px) translateY(${y - (lifted ? 36 : 0)}px) rotate(${angle}deg)`,
              zIndex: i,
            }}
          >
            {lifted ? (
              <div className="flex flex-col items-center gap-1">
                <TarotCardArt card={card} reversed={pick!.reversed} small />
                <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-accent">{pick!.position}</span>
              </div>
            ) : (
              <CardBack />
            )}
          </button>
        );
      })}
    </div>
  );
}

function CardBack() {
  return (
    <div className="h-32 w-[72px] rounded-lg border-2 border-accent/40 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 p-1.5 shadow-[0_8px_20px_-8px_rgba(0,0,0,0.8)]">
      <div className="flex h-full w-full items-center justify-center rounded-md border border-accent/30 bg-[radial-gradient(circle_at_center,rgba(245,197,24,0.18),transparent_70%)]">
        <div className="text-center">
          <div className="text-[10px] font-semibold tracking-[0.3em] text-accent/80">★</div>
          <div className="my-1 h-px w-6 bg-accent/40" />
          <div className="text-[8px] font-semibold uppercase tracking-[0.25em] text-accent/60">Arcana</div>
        </div>
      </div>
    </div>
  );
}

function TarotCardArt({ card, reversed, small }: { card: TarotCard; reversed: boolean; small?: boolean }) {
  const w = small ? 72 : 110;
  const h = small ? 128 : 192;
  return (
    <div
      className="overflow-hidden rounded-lg border-2 border-accent/40 bg-amber-50 shadow-[0_8px_20px_-8px_rgba(0,0,0,0.8)]"
      style={{ width: w, height: h }}
    >
      <img
        src={card.image}
        alt={card.name}
        loading="lazy"
        className="h-full w-full object-cover"
        style={{ transform: reversed ? "rotate(180deg)" : undefined }}
        onError={(e) => {
          // Fallback to stylised face if remote PD image fails to load
          (e.currentTarget as HTMLImageElement).style.display = "none";
          (e.currentTarget.parentElement as HTMLElement).classList.add("tarot-fallback");
        }}
      />
      <div className="tarot-fallback-face hidden h-full w-full flex-col items-center justify-between bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 p-2 text-center text-amber-100">
        <div className="text-[10px] font-bold tracking-widest text-accent">{card.num}</div>
        <div className="text-2xl">✶</div>
        <div className="text-[9px] font-semibold uppercase tracking-wider">{card.name}</div>
      </div>
      <style>{`.tarot-fallback .tarot-fallback-face { display: flex; }`}</style>
    </div>
  );
}