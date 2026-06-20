# Fixes for AstroAura AI

## 1. Signup wrongly says "account already exists"

**Cause:** `src/routes/auth.tsx` currently pre-calls `signInWithPassword` before `signUp`, then also checks `signUpData.user.identities.length === 0`. Both are unreliable:
- The pre-sign-in fires `onAuthStateChange` (the root listener invalidates the router) before we `signOut`, which can race the flow.
- `identities.length === 0` only signals "already exists" when email-confirmation is ON. With auto-confirm OFF on Lovable Cloud, a brand-new signup can also surface oddly here.
- A second click while the first request is still in flight creates a duplicate "exists" toast.

**Fix:** simplify to a single path:
- Remove the pre-`signInWithPassword` probe entirely.
- Just call `supabase.auth.signUp`. Detect "exists" only via the explicit Supabase error (`error.code === 'user_already_exists'` or message contains `already registered` / `User already registered`). On that error, switch to sign-in mode with a toast.
- Drop the `identities.length === 0` heuristic.
- Guard the submit button with a ref to prevent double-submit.

## 2. Password must be visible during signup

In `src/routes/auth.tsx`, render the password input as `type="text"` when `mode === "signup"` (keep `type="password"` for sign-in). Add a small "Password will be visible while you type" helper line under the field in signup mode.

## 3. First 2 minutes free (instead of first message free)

Currently `wallet_debit_for_chat` (DB function) and `chat_threads.free_consumed` give exactly **one free message**. Change to **2 minutes free from the first user message**.

Migration:
- Add column `chat_threads.free_started_at timestamptz`.
- Rewrite `public.wallet_debit_for_chat(_user_id, _thread_id, _astrologer_id, _rate_paise)`:
  - On first call for the thread, set `free_started_at = now()`, set `free_consumed = false`, return current balance without debit.
  - On subsequent calls, if `now() - free_started_at < interval '2 minutes'`, return balance without debit.
  - Otherwise behave as today: require `balance >= _rate_paise`, debit, log `wallet_transactions`, return new balance (or NULL on insufficient funds).

Client (`src/routes/_authenticated/chat.$slug.tsx`):
- Replace the "first message free" banner with a live countdown: `Free for 2:00 → 0:00`, then `₹X/min after`.
- Drive countdown from `freeStartedAt` returned by `startChatThread`; show "Free trial ended" when expired.
- `canSend` logic: allow send if countdown active OR balance ≥ rate.

`src/lib/chat.functions.ts` `startChatThread` returns the new `freeStartedAt` field (nullable until first message).

## 4. AI replies failing / errors

Likely causes seen in this codebase:
- `useChat` `onError` surfaces `e.message`, but the server route returns plain text bodies (`new Response("Thread not found", { status: 404 })` etc.), and 402 returns JSON. The AI SDK turns non-stream HTTP errors into a generic `"Failed to fetch"` style message, so the user just sees "Chat failed".
- The `transport` custom `fetch` swallows non-2xx responses without throwing, so `useChat` proceeds to try and parse a JSON error body as a stream.

Fix in `src/routes/api/chat.ts`:
- Return all error bodies as JSON: `{ error: "thread_not_found" | "insufficient_balance" | "ai_unavailable" | ... , message: "<human>" }` with proper status.
- Wrap the `streamText` setup + `LOVABLE_API_KEY` check + provider call in `try/catch`; on catch return `502` JSON with the gateway message so the UI shows it.

Fix in `src/routes/_authenticated/chat.$slug.tsx`:
- In the transport `fetch` wrapper, when `!res.ok`, read JSON, toast the `message`, and `throw new Error(message)` so `useChat`'s `onError` fires cleanly and the optimistic user bubble is rolled back.
- Specific toasts for `insufficient_balance` (CTA → /wallet), `rate_limited` (429), `ai_unavailable` (402/5xx).
- Add a retry button on the last failed assistant turn.

Also confirm/keep the model id `google/gemini-3-flash-preview` (current Lovable AI default per the gateway docs).

## 5. Verification after build

- Sign up a fresh phone → success toast, lands on `/onboarding`.
- Sign up that same phone again → toast says "already exists", form flips to sign-in.
- Signup form shows the password as plain text.
- Open a chat → countdown starts at 2:00, messages free during that window, debit only kicks in after 2:00.
- Force-empty wallet after the trial → user sees `Top up to continue` and a clear "Insufficient balance" toast on send.
- Trigger a server error (temporarily wrong model id locally) → UI shows the actual error message, not a silent hang.

## Final report
After implementing, I'll give a full walk-through of every page (landing, auth, onboarding, home, astrologer profile, chat, horoscope, wallet, profile, admin), confirming what works, what's mocked (payments), and what's pending so you have a clean status of the whole site.

## Technical changes (files touched)
- `src/routes/auth.tsx` — remove pre-signin, fix duplicate detection, show password in signup, debounce submit.
- `supabase/migrations/<new>.sql` — add `chat_threads.free_started_at`, rewrite `wallet_debit_for_chat` for 2-minute free window.
- `src/lib/chat.functions.ts` — return `freeStartedAt`.
- `src/routes/api/chat.ts` — JSON error envelopes, try/catch around gateway, preserve streaming success path.
- `src/routes/_authenticated/chat.$slug.tsx` — countdown UI, robust error toasts, retry, free-window send gate.

No payment integration in this pass (as agreed).
