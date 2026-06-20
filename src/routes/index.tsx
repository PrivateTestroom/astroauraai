import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { AppLogo } from "@/components/AppLogo";
import { Sparkles, MessageCircle, Star } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AstroAura AI — Chat with AI Astrologers" },
      { name: "description", content: "Real Vedic, KP, Hellenistic and Tarot guidance from AI astrologers. Daily horoscope, birth chart, ₹5/min." },
      { property: "og:title", content: "AstroAura AI — Chat with AI Astrologers" },
      { property: "og:description", content: "Real Vedic, KP, Hellenistic and Tarot guidance from AI astrologers." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <main className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-6 py-10">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <AppLogo size={120} />
        <h1 className="font-display mt-8 text-5xl font-bold leading-tight">
          Astro<span className="text-accent">Sage</span>
          <span className="block text-2xl font-normal text-muted-foreground">AI Astrologers, real guidance.</span>
        </h1>
        <p className="mt-6 max-w-xs text-sm text-muted-foreground">
          Vedic · KP · Hellenistic · Tarot · Numerology — synthesized by AI trained on classical systems. Your first minute is free.
        </p>

        <div className="mt-10 grid w-full grid-cols-3 gap-3 text-xs">
          <Feature icon={MessageCircle} label="Chat 1-on-1" />
          <Feature icon={Sparkles} label="Daily horoscope" />
          <Feature icon={Star} label="Birth chart" />
        </div>
      </div>

      <div className="mt-8 space-y-3">
        <Link
          to="/auth"
          search={{ mode: "signup" }}
          className="block w-full rounded-2xl bg-primary py-4 text-center font-semibold text-primary-foreground shadow-[0_8px_30px_-8px_rgba(168,85,247,0.7)] transition hover:brightness-110"
        >
          Create my chart — free
        </Link>
        <Link
          to="/auth"
          search={{ mode: "signin" }}
          className="block w-full rounded-2xl border border-white/15 py-4 text-center text-sm font-medium text-foreground/90 transition hover:bg-white/5"
        >
          I already have an account
        </Link>
      </div>
    </main>
  );
}

function Feature({ icon: Icon, label }: { icon: typeof Sparkles; label: string }) {
  return (
    <div className="glass flex flex-col items-center gap-1.5 rounded-xl px-2 py-3">
      <Icon className="h-5 w-5 text-accent" />
      <span className="text-[11px] leading-tight text-muted-foreground">{label}</span>
    </div>
  );
}
