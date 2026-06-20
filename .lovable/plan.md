# AstroAura — Pro Upgrade Plan

I'll pick the visual direction (Deep Cosmic Editorial — near-black navy `#0A0E1F`, warm gold `#C9A24B`, ivory text, Cormorant Garamond display + Inter body) and execute the whole upgrade in one pass.

## 1. Astrology engines (built into the codebase, deterministic)

All three systems live in `src/lib/astrology/` as pure TS, run server-side, fed to the AI as structured context.

- **Parashara / Jyotish** (`parashara.ts`): Lahiri sidereal already exists — extend with all 9 grahas (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu), house placements (whole-sign + Placidus option), Navamsa (D9), Vimshottari Dasha tree (Mahadasha → Antardasha → Pratyantar) with current period, key yogas (Raja, Dhana, Gajakesari, Kemadruma, Neecha Bhanga), planetary aspects (drishti), dignity (exalt/debilitate/own/moolatrikona).
- **KP (Krishnamurti Paddhati)** (`kp.ts`): KP ayanamsa, cuspal sub-lords for all 12 houses, significators per planet (occupant/owner/nakshatra-lord chain), Ruling Planets for the moment, sub-sub-lord for fine timing.
- **Hellenistic** (`hellenistic.ts`): Tropical zodiac, sect (diurnal/nocturnal), domicile/exaltation/triplicity/bound/decan (Egyptian terms), Lots (Fortune, Spirit, Eros, Necessity), planetary joys, whole-sign houses, current transits to natal, profections (annual lord).
- **Panchang + Numerology** (`panchang.ts`, `numerology.ts`): Tithi, Vara, Nakshatra, Yoga, Karana for today; Mulank + Bhagyank.
- **Match-making** (`ashtakoot.ts`): Full Guna Milan — Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot, Nadi → 36-point score with breakdown.

Verified with astronomy-engine for accuracy.

## 2. AI ↔ Astrology bridge

- New `src/lib/ai/astrology-context.ts`: given a user's birth data + astrologer profile, computes ONLY the systems that astrologer uses, returns a compact structured JSON block injected into the AI system prompt.
- Each astrologer gets a `systems: ("parashara"|"kp"|"hellenistic")[]` column. Some use one, some combine all three. The system prompt tells the AI: *"Here is the verified chart data from system X. Form your own interpretation and synthesize."*
- Tool-calling kept disabled (free Gemini tier doesn't always honor it); structured context is enough and cheaper.

## 3. Astrotalk-style features

- **Kundli page** (`/_authenticated/kundli`): Rendered D1 South-Indian + North-Indian chart (SVG), planet table with degree/sign/nakshatra/dignity, Dasha timeline with current period highlighted, key yogas list.
- **Match-making** (`/_authenticated/match`): Two birth inputs → 36-point Ashtakoot breakdown with explanation per koota.
- **Horoscope hub** (`/_authenticated/horoscope`): Daily / Weekly / Monthly tabs for all 12 rashis + today's Panchang widget. Cached per-day in `horoscope_cache`.
- **Astrologer profile page**: Rating stars, languages, specialties (Love/Career/Marriage/Finance), experience years, systems used, sample reading.
- **Wallet recharge packs**: ₹99 / ₹299 / ₹599 / ₹1499 quick top-up tiles (UI only — actual payments stay manual until you add Stripe/Razorpay).

## 4. Admin controls (super admin only)

Admin page extended:
- Edit each astrologer's `rate_paise_per_min`, `free_minutes` (currently hardcoded 2), specialties, languages, systems, online status, bio.
- View/credit any user's wallet (already exists — keep).
- Toggle astrologer visibility.

Admin = phone `8767598378` (already wired via `has_role`).

## 5. Visual redesign — Deep Cosmic Editorial

- **Palette**: bg `#0A0E1F`, surface `#141a33`, gold `#C9A24B`, ivory `#E8E6E1`, muted `#6B7290`. No more rainbow gradients.
- **Type**: Cormorant Garamond (display, serif, used sparingly for h1/astrologer names), Inter (body). Drop current `font-display` rainbow vibe.
- **Components**: thinner borders (`1px hsl(45 35% 60% / 0.18)`), gold hairline dividers, glass panels with `backdrop-blur` + low opacity, restrained gold accents only on CTAs and active states.
- **Home**: editorial layout — quote of the day, today's panchang strip, "Talk to an astrologer" featured card, horoscope teaser, kundli teaser.
- **Motion**: subtle fade/slide on mount only, no bouncy emoji animations.

## 6. Bug sweep

- Signup duplicate-toast: trust the auth error code (`user_already_exists` / `email_taken`) instead of optimistic toast.
- Chat blank state: ensure `useChat` mounts with `messages` from server even on first send.
- Wallet balance refresh after debit (already partially in `onFinish` — verify).
- Free-window timer drift across reloads (use server `free_started_at` as source of truth — already done, verify).
- Replace remaining Lovable badge (you asked before — re-verify hidden via CSS in `__root.tsx`).

## 7. Database changes (one migration)

```sql
ALTER TABLE astrologers
  ADD COLUMN free_minutes int NOT NULL DEFAULT 2,
  ADD COLUMN systems text[] NOT NULL DEFAULT ARRAY['parashara'],
  ADD COLUMN languages text[] NOT NULL DEFAULT ARRAY['English','Hindi'],
  ADD COLUMN specialties text[] NOT NULL DEFAULT ARRAY['Love','Career'],
  ADD COLUMN experience_years int NOT NULL DEFAULT 5,
  ADD COLUMN rating numeric(2,1) NOT NULL DEFAULT 4.7,
  ADD COLUMN bio text;

-- Admin update policy
CREATE POLICY "admins update astrologers" ON astrologers
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- wallet_debit_for_chat: read free_minutes from astrologer row instead of hardcoded 2
```

Seed: assign different system combos to each existing astrologer.

## 8. Files touched (high level)

**New**: `src/lib/astrology/{parashara,kp,hellenistic,panchang,numerology,ashtakoot,houses,dasha,yogas}.ts`, `src/lib/ai/astrology-context.ts`, `src/routes/_authenticated/{kundli,match}.tsx`, `src/components/{KundliChart,DashaTimeline,PanchangWidget,GunaMilan}.tsx`, design tokens in `src/styles.css`.

**Edited**: `src/routes/api/chat.ts` (inject astrology context), `src/routes/_authenticated/{home,astrologer.$slug,horoscope,admin,wallet,chat.$slug}.tsx`, `src/lib/chat.functions.ts`, `src/routes/auth.tsx` (signup error handling), `src/routes/__root.tsx` (fonts + badge mask), `src/components/AstrologerCard.tsx`, `wallet_debit_for_chat` SQL function.

## 9. Out of scope (call out now)

- Real payments (Razorpay/Stripe) — wallet top-up tiles will be UI-only until you say "wire payments".
- Voice/video call with astrologer — text chat only.
- Push notifications.

If this looks right, approve and I'll start with the DB migration, then ship the engines + redesign + features back-to-back.