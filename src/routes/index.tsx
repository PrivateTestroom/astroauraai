import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { AppLogo } from "@/components/AppLogo";
import {
  Sparkles,
  MessageCircle,
  Star,
  ShieldCheck,
  Zap,
  ChevronDown,
  Quote,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "AstroAura AI — Chat with AI Astrologers | Vedic · KP · Tarot",
      },
      {
        name: "description",
        content:
          "Talk to AI astrologers trained in Vedic, KP, Hellenistic and Tarot. Daily horoscope, birth chart, matchmaking. First 2 minutes free.",
      },
      {
        property: "og:title",
        content: "AstroAura AI — Chat with AI Astrologers",
      },
      {
        property: "og:description",
        content:
          "Real Vedic, KP, Hellenistic and Tarot guidance from AI astrologers. Your first 2 minutes are free.",
      },
    ],
  }),
  component: Landing,
});

const testimonials = [
  {
    name: "Priya R.",
    location: "Mumbai",
    text: "The career reading was scarily accurate. It told me about a job change window and I actually got the offer that week.",
    rating: 5,
  },
  {
    name: "Arjun M.",
    location: "Bengaluru",
    text: "Liked that it used my actual birth chart and not just my sun sign. The KP system predictions about my relationship actually played out.",
    rating: 5,
  },
  {
    name: "Sneha K.",
    location: "Delhi",
    text: "Checked my horoscope every morning for 3 weeks now. The daily guidance feels personal, not copy-pasted like other apps.",
    rating: 4,
  },
];

const faqs = [
  {
    q: "Is this real astrology or just AI making things up?",
    a: "Your readings are based on real astronomical calculations using Swiss-grade ephemeris data — the same engine professional astrologers use. The AI interprets your actual planetary positions, nakshatra, and dasha periods. It's not guessing from your sun sign.",
  },
  {
    q: "How much does it cost?",
    a: "Your first 2 minutes with any astrologer are free. After that, rates start at ₹5 per minute. You only pay for the time you use — no subscriptions, no hidden charges.",
  },
  {
    q: "Do I need to know my exact birth time?",
    a: "Yes, for the most accurate readings. Your birth chart (Kundli) is calculated from your date, time, and place of birth. If you're unsure, an approximate time still gives useful results for daily horoscopes.",
  },
  {
    q: "Can I ask about specific problems?",
    a: "Absolutely. Chat about love, career, marriage timing, finances, family disputes, health, or any life question. The astrologer will look at your chart and give you specific guidance.",
  },
  {
    q: "Is my information private?",
    a: "Yes. Your birth details and chat conversations are tied to your account and never shared. Only you can see your readings.",
  },
];

function Landing() {
  return (
    <main className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-6 pt-4 pb-40">
      {/* Hero banner */}
      <div className="relative -mx-6 mb-3 h-48 overflow-hidden rounded-b-[2.5rem]">
        <img
          src="https://images.pexels.com/photos/11468694/pexels-photo-11468694.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
          alt="Soft pastel sunrise cloudscape"
          className="h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/10 to-background" />
      </div>

      {/* Hero section */}
      <div className="flex flex-col items-center text-center">
        <AppLogo size={80} />
        <h1 className="font-display mt-5 text-5xl font-bold leading-[1.1] tracking-tight text-foreground">
          Astro<span className="text-primary">Aura</span>
        </h1>
        <p className="font-display mt-2 block text-xl font-normal text-muted-foreground">
          AI Astrologers, real guidance.
        </p>
        <p className="mt-4 max-w-xs text-[15px] leading-relaxed text-muted-foreground">
          Real Vedic astrology powered by actual planetary calculations — not
          sun-sign guesses. Chat instantly, 24×7.{" "}
          <span className="font-semibold text-primary">
            Your first 2 minutes are free.
          </span>
        </p>

        <div className="mt-6 grid w-full grid-cols-3 gap-3 text-xs">
          <Feature icon={MessageCircle} label="Chat 1-on-1" />
          <Feature icon={Sparkles} label="Daily horoscope" />
          <Feature icon={Star} label="Birth chart" />
        </div>
      </div>

      {/* CTAs */}
      <div className="mt-8 space-y-3">
        <Link
          to="/auth"
          search={{ mode: "signup" }}
          className="block w-full rounded-2xl bg-primary py-4 text-center text-base font-semibold text-primary-foreground shadow-[0_10px_30px_-10px_oklch(0.62_0.14_55_/_0.6)] transition hover:brightness-105 active:scale-[0.99]"
        >
          Get your free reading
        </Link>
        <Link
          to="/auth"
          search={{ mode: "signin" }}
          className="block w-full rounded-2xl border border-border bg-card/70 py-4 text-center text-sm font-semibold text-foreground transition hover:bg-secondary"
        >
          I already have an account
        </Link>
      </div>

      {/* Social proof stats */}
      <div className="mt-8 grid grid-cols-3 gap-2 rounded-2xl border border-border/60 bg-card/40 py-5 text-center">
        <Stat value="5,000+" label="readings given" />
        <Stat value="4.8★" label="avg rating" />
        <Stat value="2 min" label="free trial" />
      </div>

      {/* Trust badges */}
      <div className="mt-6 space-y-3">
        <TrustBadge
          icon={ShieldCheck}
          title="Real calculations, not guesses"
          body="Swiss-grade ephemeris computes your actual Moon sign, nakshatra, and dasha periods — the same engine professional astrologers use."
        />
        <TrustBadge
          icon={Zap}
          title="Instant answers, 24×7"
          body="No waiting for appointments. Your chat starts the moment you tap — day or night."
        />
        <TrustBadge
          icon={MessageCircle}
          title="Chat naturally, ask anything"
          body="Love, career, marriage timing, finances, family. Ask in your own words and get specific chart-based guidance."
        />
      </div>

      {/* Testimonials */}
      <section className="mt-10">
        <h2 className="font-display mb-4 text-center text-lg font-semibold text-foreground">
          What users are saying
        </h2>
        <div className="space-y-3">
          {testimonials.map((t) => (
            <div key={t.name} className="glass rounded-2xl p-4">
              <div className="mb-2 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${
                      i < t.rating
                        ? "fill-primary text-primary"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
              <blockquote className="flex gap-2 text-[14px] leading-relaxed text-foreground">
                <Quote className="h-4 w-4 shrink-0 text-primary/50" />
                <span>{t.text}</span>
              </blockquote>
              <div className="mt-2 text-xs text-muted-foreground">
                {t.name} · {t.location}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-10">
        <h2 className="font-display mb-4 text-center text-lg font-semibold text-foreground">
          Questions?
        </h2>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <FaqItem key={i} q={faq.q} a={faq.a} />
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <div className="mt-10 rounded-2xl border border-primary/30 bg-primary/8 p-6 text-center">
        <h2 className="font-display text-xl font-semibold text-foreground">
          Your stars are waiting.
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Get your free birth chart and first reading in under 2 minutes.
        </p>
        <Link
          to="/auth"
          search={{ mode: "signup" }}
          className="mt-4 inline-block rounded-2xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_10px_30px_-10px_oklch(0.62_0.14_55_/_0.6)] transition hover:brightness-105 active:scale-[0.99]"
        >
          Start free now
        </Link>
      </div>
    </main>
  );
}

function Feature({
  icon: Icon,
  label,
}: {
  icon: typeof Sparkles;
  label: string;
}) {
  return (
    <div className="glass flex flex-col items-center gap-1.5 rounded-2xl px-2 py-4">
      <Icon className="h-5 w-5 text-primary" />
      <span className="text-[12px] font-medium leading-tight text-foreground">
        {label}
      </span>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="font-display text-lg font-bold text-primary">{value}</div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function TrustBadge({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof ShieldCheck;
  title: string;
  body: string;
}) {
  return (
    <div className="glass flex items-start gap-3 rounded-2xl p-4">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
      <div>
        <div className="text-sm font-semibold text-foreground">{title}</div>
        <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          {body}
        </div>
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass overflow-hidden rounded-2xl">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
      >
        <span className="text-sm font-semibold text-foreground">{q}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-primary transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 text-[13px] leading-relaxed text-muted-foreground">
          {a}
        </div>
      )}
    </div>
  );
}
