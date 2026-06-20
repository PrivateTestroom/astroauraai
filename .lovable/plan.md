
## Goal
Switch the AI astrologer chat from the Lovable AI gateway (which is currently erroring) to your own Google Gemini API key, with automatic fallback to lighter models so the free-tier quota lasts longer and chats keep working under load.

## Steps

1. **Request the secret**
   - Use the secret tool to ask you to paste your Gemini API key as `GEMINI_API_KEY`. (You won't type it in chat — it goes into a secure form.)

2. **Add a Gemini provider helper** (`src/lib/gemini.server.ts`)
   - Thin wrapper around `@google/generative-ai` (or direct REST to `generativelanguage.googleapis.com`) using `process.env.GEMINI_API_KEY`.
   - Exposes a `streamWithFallback({ system, messages })` function.

3. **Automatic model fallback chain**
   - Try in order, moving to the next on `429` (quota), `503` (overloaded), or hard error:
     1. `gemini-2.5-flash` (primary — best quality on free tier)
     2. `gemini-2.5-flash-lite` (cheaper, higher RPM)
     3. `gemini-1.5-flash` (very generous free quota)
     4. Last resort: existing Lovable AI gateway (`google/gemini-3-flash-preview`) if `LOVABLE_API_KEY` exists.
   - Log which model actually served the reply (server console only).

4. **Wire it into the chat route** (`src/routes/api/chat.ts`)
   - Replace the current `createLovableAiGatewayProvider(...)` + `streamText({ model: gateway(...) })` block with the new helper.
   - Keep all surrounding logic intact: auth, thread lookup, `wallet_debit_for_chat`, native chart context injection, message persistence in `onFinish`, JSON error envelopes (`insufficient_balance`, `ai_unavailable`, etc.).
   - Stream via AI SDK's `streamText` using the `@ai-sdk/google` provider so `toUIMessageStreamResponse` keeps working with the existing `useChat` UI — no client changes needed.

5. **Also update horoscope generation** (`src/lib/horoscope.functions.ts`)
   - Same fallback helper so daily horoscopes use your key too and don't fail when the gateway is down.

6. **Dependency**
   - `bun add @ai-sdk/google` (official AI SDK Google provider — supports the same `streamText` interface and handles SSE/fallback cleanly).

7. **No UI / DB / auth changes**
   - Chat UI, 2-minute free trial, wallet, signup flow, admin — all untouched.
   - Existing `LOVABLE_API_KEY` remains as the final fallback so nothing breaks if your key hits daily quota.

## Verification
- Send a chat message → reply streams from `gemini-2.5-flash`.
- Force a 429 (simulated) → server logs show fallback to `2.5-flash-lite`, user still gets a reply.
- Horoscope page generates a fresh entry without errors.
- Missing `GEMINI_API_KEY` → server returns the existing `ai_unavailable` JSON error and the UI toast shows.

After you approve, I'll request the `GEMINI_API_KEY` secret in the very next step before writing any code.
