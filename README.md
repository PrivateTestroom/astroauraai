# AstroAura AI

Astrotalk-style AI astrology app (PWA). Stack: TanStack Start v1, React 19, Vite 7, Tailwind CSS v4.

## Zero-setup takeover (Bolt.new, Cursor, any agent)

Nothing needs to be configured:

- **Database / Auth / Storage** — `.env` is committed with the publishable URL + key of the live backend. Users, wallets, chats, astrologers all already live there.
- **AI chat (Gemini)** — the secret keys stay on the live server `https://astroauraai.lovable.app`. When this frontend runs anywhere other than Lovable, chat automatically calls `https://astroauraai.lovable.app/api/chat` (CORS enabled, user's login token is forwarded). Override with `VITE_CHAT_API_URL` if needed.
- Never commit real secret keys (Google auto-revokes leaked Gemini keys). If you self-host the server routes, set `GEMINI_API_KEY` (and optionally `LOVABLE_API_KEY`) as server env vars.

## Map of the code

- `src/lib/astrology/` — deterministic engine (astronomy-engine, Lahiri ayanamsa): Parashara, KP, Hellenistic, Panchang, Ashtakoot guna milan. Tests: `engine.test.ts`.
- `src/lib/ai/astrology-context.ts` — turns computed chart into AI prompt context (AI interprets, never recalculates).
- `src/routes/api/chat.ts` — streaming chat endpoint, auth + per-minute billing (2 free min/thread; debits currently bypassed = free).
- `src/lib/gemini.server.ts` — model fallback: Gemini key → Lovable AI Gateway.
- `src/routes/_authenticated/*` — home, chat, horoscope, kundli, match, tarot, wallet, profile, admin.
- `src/lib/*.functions.ts` — server functions (createServerFn).
- `src/routes/__root.tsx` — layout, WhatsApp support button (https://wa.link/eyvvsn), PWA install prompt.

## Pending

Real payments (plan: Topmate redirect + manual admin credit), lighter "Celestial Dawn" redesign, wallet shown in minutes (~₹20/min reference).

## Run

```
bun install
bun run dev
```
