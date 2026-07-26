import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Send, Sparkles, Wallet, Feather } from "lucide-react";
import { startChatThread } from "@/lib/chat.functions";
import { CosmicLoader } from "@/components/CosmicLoader";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chat/$slug")({
  head: () => ({ meta: [{ title: "Chat — AstroAura" }] }),
  component: ChatPage,
});

function ChatPage() {
  const { slug } = Route.useParams();
  const start = useServerFn(startChatThread);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const session = useQuery({
    queryKey: ["chat-session", slug],
    queryFn: () => start({ data: { astrologerSlug: slug } }),
    staleTime: 0,
  });

  if (session.isLoading) return <main className="px-6 py-10"><CosmicLoader label="Opening the consultation…" /></main>;
  if (session.error || !session.data) return <main className="px-6 py-10 text-center text-destructive">Could not open chat.</main>;

  return <ChatBoot session={session.data} slug={slug} onBalanceRefresh={() => qc.invalidateQueries({ queryKey: ["wallet"] })} navigateBack={() => navigate({ to: "/home" })} />;
}

type Session = Awaited<ReturnType<typeof startChatThread>>;

function ChatBoot({ session, slug, onBalanceRefresh, navigateBack }: { session: Session; slug: string; onBalanceRefresh: () => void; navigateBack: () => void }) {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [input, setInput] = useState("");
  const [balance, setBalance] = useState(session.balancePaise);
  const [freeStartedAt, setFreeStartedAt] = useState<string | null>(session.freeStartedAt);
  const [now, setNow] = useState(() => Date.now());

  // Tick countdown every second while free window is active
  useEffect(() => {
    if (!freeStartedAt) return;
    const started = new Date(freeStartedAt).getTime();
    const ends = started + 2 * 60 * 1000;
    if (Date.now() >= ends) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [freeStartedAt]);

  const freeRemainingMs = freeStartedAt
    ? Math.max(0, new Date(freeStartedAt).getTime() + 2 * 60 * 1000 - now)
    : 2 * 60 * 1000;
  const freeActive = freeRemainingMs > 0;
  const mm = Math.floor(freeRemainingMs / 60000);
  const ss = Math.floor((freeRemainingMs % 60000) / 1000).toString().padStart(2, "0");

  const initialMessages: UIMessage[] = useMemo(
    () => session.messages.map((m) => ({ id: m.id, role: m.role, parts: m.parts })) as UIMessage[],
    [session.messages],
  );
  const initialIds = useMemo(() => new Set(initialMessages.map((m) => m.id)), [initialMessages]);

  const transport = useMemo(() => new DefaultChatTransport({
    api: "/api/chat",
    fetch: async (url, init) => {
      const { data } = await supabase.auth.getSession();
      const headers = new Headers(init?.headers);
      if (data.session) headers.set("Authorization", `Bearer ${data.session.access_token}`);
      const body = init?.body ? JSON.parse(init.body as string) : {};
      const res = await fetch(url, { ...init, headers, body: JSON.stringify({ ...body, threadId: session.threadId }) });
      if (!res.ok) {
        let errBody: { error?: string; message?: string } = {};
        try { errBody = await res.clone().json(); } catch { /* not json */ }
        const message = errBody.message || `Chat failed (${res.status})`;
        if (res.status === 402) toast.error(message, { action: { label: "Top up", onClick: () => { window.location.href = "/wallet"; } } });
        else if (res.status === 429) toast.error("Too many requests. Please wait a moment.");
        else toast.error(message);
        throw new Error(message);
      }
      return res;
    },
  }), [session.threadId]);

  const { messages, sendMessage, status } = useChat({
    id: session.threadId,
    messages: initialMessages,
    transport,
    onError: (e) => {
      // Toast already shown in fetch wrapper for HTTP errors; only toast on bare stream errors.
      if (e?.message && !e.message.startsWith("Chat failed")) toast.error(e.message);
    },
    onFinish: () => {
      onBalanceRefresh();
      // Refresh balance + free-window state from server
      supabase.auth.getUser().then(async ({ data }) => {
        if (!data.user) return;
        const [{ data: b }, { data: t }] = await Promise.all([
          supabase.from("wallet_balances").select("balance_paise").eq("user_id", data.user.id).maybeSingle(),
          supabase.from("chat_threads").select("free_started_at").eq("id", session.threadId).maybeSingle(),
        ]);
        if (b) setBalance(b.balance_paise);
        if (t && !freeStartedAt) setFreeStartedAt((t as { free_started_at?: string | null }).free_started_at ?? null);
      });
    },
  });

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, status]);

  const isLoading = status === "submitted" || status === "streaming";
  const ratePaise = session.astrologer.rate_paise_per_min;
  const canSend = !isLoading && input.trim().length > 0 && (freeActive || balance >= ratePaise);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSend) return;
    const text = input.trim();
    setInput("");
    await sendMessage({ text });
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  return (
    <main className="relative z-10 mx-auto flex h-[100dvh] max-w-md flex-col px-3 pb-24 pt-3">
      <header className="glass flex items-center gap-3 rounded-2xl p-3">
        <button onClick={navigateBack} className="text-muted-foreground"><ArrowLeft className="h-5 w-5" /></button>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${session.astrologer.avatar_gradient} text-xl`}>
          {session.astrologer.avatar_emoji}
        </div>
        <div className="flex-1">
          <div className="font-display font-semibold leading-tight">{session.astrologer.display_name}</div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Online · ₹{(ratePaise / 100).toFixed(0)}/min
          </div>
        </div>
        <Link to="/wallet" className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1.5 text-[11px] font-semibold">
          <Wallet className="h-3 w-3 text-accent" />₹{(balance / 100).toFixed(0)}
        </Link>
      </header>

      {freeActive ? (
        <FreeCountdown mm={mm} ss={ss} totalMs={freeRemainingMs} ratePaise={ratePaise} />
      ) : balance < ratePaise ? (
        <Link to="/wallet" className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
          <span>Free trial ended. Top up to continue.</span>
          <span className="font-semibold">Top up →</span>
        </Link>
      ) : (
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-muted-foreground">
          <Sparkles className="h-3 w-3 text-accent" /> ₹{(ratePaise / 100).toFixed(0)}/minute
        </div>
      )}

      <div ref={scrollRef} className="mt-3 flex-1 space-y-3 overflow-y-auto pb-4">
        {messages.length === 0 && (
          <div className="glass mt-4 rounded-2xl p-5 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 text-accent"><Sparkles className="h-4 w-4" /> <span className="font-display text-base text-foreground">Namaste 🙏</span></div>
            <p className="mt-2 leading-relaxed">
              Share what's on your mind — career, love, marriage, a decision you're weighing, or a name/date you want me to read against your chart. Specific questions give the sharpest answers.
            </p>
          </div>
        )}
        {messages.map((m, i) => {
          const isLast = i === messages.length - 1;
          const streaming = isLoading && isLast && m.role === "assistant";
          const reveal = m.role === "assistant" && !initialIds.has(m.id);
          return (
            <Bubble
              key={m.id}
              m={m}
              astroEmoji={session.astrologer.avatar_emoji}
              streaming={streaming}
              reveal={reveal}
            />
          );
        })}
        {status === "submitted" && (
          <div className="flex gap-2"><Typing /></div>
        )}
      </div>

      <form onSubmit={onSubmit} className="glass mb-16 flex items-end gap-2 rounded-2xl p-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSubmit(e as never); } }}
          rows={1}
          placeholder={!freeActive && balance < ratePaise ? "Top up to continue…" : "Ask your astrologer…"}
          className="max-h-32 flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
        />
        <button type="submit" disabled={!canSend} className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground disabled:opacity-40">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </main>
  );
}

function useSlowReveal(fullText: string, enabled: boolean) {
  const [idx, setIdx] = useState(0);
  const textRef = useRef(fullText);
  textRef.current = fullText;

  useEffect(() => {
    if (!enabled) { setIdx(fullText.length); return; }
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      setIdx((cur) => {
        const target = textRef.current;
        if (cur >= target.length) return cur;
        let next = cur;
        while (next < target.length && /\s/.test(target[next])) next++;
        while (next < target.length && !/\s/.test(target[next])) next++;
        return next;
      });
    };
    const id = setInterval(tick, 140);
    return () => { cancelled = true; clearInterval(id); };
  }, [enabled, fullText.length]);

  return enabled ? fullText.slice(0, idx) : fullText;
}

function Bubble({ m, astroEmoji, streaming, reveal }: { m: UIMessage; astroEmoji: string; streaming?: boolean; reveal?: boolean }) {
  const isUser = m.role === "user";
  const fullText = m.parts.map((p) => (p.type === "text" ? (p as { text: string }).text : "")).join("");
  const revealed = useSlowReveal(fullText, !isUser && !!reveal);
  const text = isUser ? fullText : revealed;
  const stillWriting = !isUser && (streaming || revealed.length < fullText.length);
  return (
    <div className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 text-sm">{astroEmoji}</div>}
      <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${isUser ? "bg-primary text-primary-foreground" : "glass text-foreground"}`}>
        {isUser ? (
          text
        ) : (
          <>
            <div className="prose prose-sm prose-invert max-w-none [&_p]:my-1"><ReactMarkdown>{text || "…"}</ReactMarkdown></div>
            {stillWriting && (
              <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-accent/80">
                <Feather className="h-3 w-3 animate-[writing_1.4s_ease-in-out_infinite]" />
                <span className="italic">writing…</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Typing() {
  return (
    <div className="glass flex items-center gap-1.5 rounded-2xl px-3 py-2">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent" style={{ animationDelay: "0ms" }} />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent" style={{ animationDelay: "120ms" }} />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent" style={{ animationDelay: "240ms" }} />
    </div>
  );
}

function FreeCountdown({ mm, ss, totalMs, ratePaise }: { mm: number; ss: string; totalMs: number; ratePaise: number }) {
  // Colour states: green > 30s, amber ≤ 30s, red ≤ 10s.
  const warning = totalMs <= 30_000;
  const critical = totalMs <= 10_000;
  const tone = critical
    ? "border-red-400/50 bg-red-500/15 text-red-200"
    : warning
    ? "border-amber-400/50 bg-amber-500/15 text-amber-200"
    : "border-accent/30 bg-accent/10 text-accent";
  const pct = Math.max(0, Math.min(100, (totalMs / (2 * 60_000)) * 100));
  const barTone = critical ? "bg-red-400" : warning ? "bg-amber-400" : "bg-accent";
  return (
    <div className={`mt-2 rounded-xl border px-3 py-2 text-[11px] ${tone}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <Sparkles className="h-3 w-3" />
          {critical ? "Free time ending" : warning ? "Free time almost up" : "Free trial"}
        </span>
        <span className="font-mono tabular-nums font-semibold">
          {mm}:{ss} left · then ₹{(ratePaise / 100).toFixed(0)}/min
        </span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full transition-all duration-1000 ${barTone}`} style={{ width: `${pct}%` }} />
      </div>
      {warning && (
        <Link
          to="/wallet"
          className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-black/40 px-3 py-1.5 text-[11px] font-semibold text-accent transition hover:bg-black/60"
        >
          <Wallet className="h-3 w-3" /> Add ₹99 to keep the flow →
        </Link>
      )}
    </div>
  );
}