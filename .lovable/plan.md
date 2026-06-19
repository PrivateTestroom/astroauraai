
# AstroSage AI — Build Plan

You picked the full scope (onboarding + 10 AIs + chat + horoscope + wallet + admin + PWA + real Parashara/KP/Hellenistic engine). Honestly: that is a 2–3 week build done right, not a single chat message. I'm going to ship it in **4 phases**, each independently usable, so you can test as we go instead of waiting weeks for a black box.

I'll start **Phase 1 immediately after you approve**. Each later phase = one short message from you saying "continue".

---

## Design direction (you said "you decide")

**"Midnight Cosmos"** — deep navy `#0A0A23` background, violet `#7C3AED` primary, gold `#F5C518` accents, soft pink `#EC4899` highlights. Glassmorphic cards, subtle constellation/star particles, glowing avatars for astrologers, premium feel (think Apple x Co-Star x Astrotalk). Fonts: **Fraunces** (display, for mystical headings) + **Inter** (body). Mobile-first since most users will be on phones.

---

## Phase 1 — Foundation (this build, today)

- Enable Lovable Cloud (Postgres + Auth + Storage).
- Auth: email/phone + password sign-up, Google sign-in (no OTP, per your spec — phone stored as identifier, password is the secret).
- Onboarding intake page: name, gender, state (India dropdown), city (optional text), DOB (year/month/day dropdowns, prioritized but typeable), birth time (optional, with "still ~80% accurate" note), birth place.
- DB schema: `profiles`, `birth_charts`, `astrologers`, `chat_threads`, `chat_messages`, `wallet_transactions`, `wallet_balances`, `user_roles` (with `has_role` security-definer), `horoscope_cache`.
- 10 seeded astrologers with photos (AI-generated), names, specialty (Vedic / Tarot / Numerology / KP / combined), per-minute rate (₹5–₹25), priority ordering, "recommended" badge.
- Visual shell: home with astrologer grid, profile drawer, bottom nav.
- PWA: manifest + icons + theme color (installable, no offline yet).
- Super-admin role seeding so `8767598378` / `Powerking1111` becomes admin on first signup.

## Phase 2 — Chat + Wallet (next message)

- Chat UI with AI Elements, one thread per astrologer per user, streaming via Lovable AI Gateway (Gemini 3 Flash). Secret slot added for your own Gemini key — flip an env flag to swap providers.
- Per-astrologer system prompts that enforce: only answer via astrological systems, refuse low-quality predictions ("do I have a girlfriend yes/no"), inject the user's birth chart + remembered context every turn.
- Wallet ledger: balance, transactions, top-up tiers (₹10/50/100/500/1000/3000) with 50%/100% bonuses, per-minute deduction during chat, 1-minute free trial per user, low-balance warnings.
- Manual top-up button (admin-credit only — real payment gateway is Phase 4).

## Phase 3 — Horoscope + Vedic/KP/Hellenistic engine (next message)

This is the big one. The "AI plus three systems" reasoning loop:

1. AI generates initial answer from birth data + general knowledge.
2. Server-side TypeScript engine computes real chart data:
   - **Parashara**: lagna, rashi, nakshatra, navamsa, Vimshottari dasha/bhukti.
   - **KP**: sub-lord theory using Krishnamurti ayanamsa, cuspal sub-lords.
   - **Hellenistic**: sect (day/night), Lots (Fortune, Spirit), whole-sign houses, planetary joys.
3. AI re-prompted with computed facts → produces final synthesized answer.

Daily horoscope: cached per-user per-day, recomputed at midnight IST, uses real transits against natal chart.

Tech: `astronomy-engine` npm package for planetary positions (no native deps, works in Cloudflare Worker runtime).

## Phase 4 — Admin panel + payments (next message)

- `/admin` route, role-gated. Dashboards: users, top spenders, most active, most consistent, payment success/failure logs, per-astrologer revenue.
- Toggles: enable/disable astrologers, edit rates, credit wallets manually, ban users, view full chat audit.
- Payment integration discussion (Razorpay recommended for India; we'll wire it after you decide).

---

## Out of scope for first pass (parking lot)

- Tarot pick-a-card module
- Voice/video calls
- Real OTP, KYC
- Push notifications, offline PWA mode
- Multi-language

---

## Technical notes (for me, not for you to worry about)

- TanStack Start + Supabase via Lovable Cloud, server functions for AI, `_authenticated` gate for app, public `/auth` and `/` landing.
- Roles in separate `user_roles` table with `has_role(uuid, app_role)` security-definer. Super-admin granted via DB trigger when the seeded phone signs up.
- AI Gateway provider helper with run-id propagation, system prompt builder that interpolates birth chart + last-5 messages summary, per-message wallet deduction in a Postgres function to avoid race conditions.
- Astrology engine in pure TS under `src/lib/astrology/` (parashara.ts, kp.ts, hellenistic.ts), tested against known ephemeris values.
- Phone+password "auth": store as `{phone}@astrosage.local` synthetic email behind Supabase email auth — fully functional login, no OTP, no SMS cost.

---

Approve and I start Phase 1 right now.
