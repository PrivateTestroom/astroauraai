import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { AppLogo } from "@components/AppLogo";
import { Sparkles, MessageCircle, Star, Brain } from "lucide-react";

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
    <main className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-6 pt-6 pb-40">
      <div className="relative -mx-6 mb-3 h-36 overflow-hidden rounded-b-[2rem]">
        <img
          src="https://images.pexels.com/photos/11468694/pexels-photo-11468694.jpeg?auto=compress&cs=tinysrgb&h=600&w=900"
          alt="Soft pastel sunrise cloudscape"
          className="h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/5 to-background" />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <AppLogo size={72} />
        <h1 className="font-display mt-4 text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
          Astro<span className="text-primary">Aura</span>
        </h1>
        <p className="font-display mt-2 text-lg font-normal text-muted-foreground">
          AI Astrologers, real guidance.
        </p>
        <p className="mt-4 max-w-xs text-[15px] leading-relaxed text-muted-foreground">
          Real planetary positions, computed from your birth chart. AI astrologers read them — Vedic, KP, Hellenistic, Tarot. Your first minute is free.
        </p>

        <div className="mt-5 flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-xs text-muted-foreground">
          <Brain className="h-3.5 w-3.5 text-primary" />
          <span>AI-powered · real ephemeris calculations</span>
        </div>

        <div className="mt-5 grid w-full grid-cols-3 gap-3 text-xs">
          <Feature icon={MessageCircle} label="Chat 1-on-1" />
          <Feature icon={Sparkles} label="Daily horoscope" />
          <Feature icon={Star} label="Birth chart" />
        </div>
      </div>

      <div className="mt-8 space-y-3">
        <Link
          to="/auth"
          search={{ mode: "signup" }}
          className="block w-full rounded-2xl bg-primary py-4 text-center text-base font-semibold text-primary-foreground shadow-[0_8px_24px_-8px_oklch(0.55_0.16_48_/_0.5)] transition-all hover:shadow-[0_12px_28px_-8px_oklch(0.55_0.16_48_/_0.6)] hover:brightness-105 active:scale-[0.98]"
        >
          Start — it's free
        </Link>
        <Link
          to="/auth"
          search={{ mode: "signin" }}
          className="block w-full rounded-2xl border border-border bg-card/70 py-4 text-center text-sm font-semibold text-foreground transition hover:bg-secondary active:scale-[0.98]"
        >
          I already have an account
        </Link>
      </div>
    </main>
  );
}

function Feature({ icon: Icon, label }: { icon: typeof Sparkles; label: string }) {
  return (
    <div className="glass flex flex-col items-center gap-1.5 rounded-2xl px-2 py-4">
      <Icon className="h-5 w-5 text-primary" />
      <span className="text-[12px] font-medium leading-tight text-foreground">{label}</span>
    </div>
  );
}
