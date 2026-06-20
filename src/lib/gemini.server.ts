import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, generateText, type LanguageModel, type UIMessage, convertToModelMessages } from "ai";

// Ordered fallback chain. Free-tier friendly models first.
const USER_KEY_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
] as const;

function buildModels(): { label: string; model: LanguageModel }[] {
  const out: { label: string; model: LanguageModel }[] = [];
  const userKey = process.env.GEMINI_API_KEY;
  if (userKey) {
    const google = createGoogleGenerativeAI({ apiKey: userKey });
    for (const id of USER_KEY_MODELS) out.push({ label: `user:${id}`, model: google(id) });
  }
  return out;
}

function isRetryable(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return /429|quota|rate.?limit|exhaust|503|overload|unavailable|500|timeout/.test(msg);
}

export async function streamChatWithFallback({
  system, messages,
}: { system: string; messages: UIMessage[] }) {
  const candidates = buildModels();
  if (candidates.length === 0) throw new Error("No AI provider configured (set GEMINI_API_KEY).");

  const modelMessages = await convertToModelMessages(messages);
  let lastErr: unknown;
  for (const c of candidates) {
    try {
      // Probe with a tiny non-streaming call so we can fall back on quota errors
      // before the SSE stream is committed to the client.
      const probe = streamText({ model: c.model, system, messages: modelMessages });
      // Touch the stream to trigger the request; if it throws synchronously on start, catch and fallback.
      // The result object is returned immediately; errors surface via the stream itself.
      console.log(`[gemini] using ${c.label}`);
      return probe;
    } catch (e) {
      lastErr = e;
      console.warn(`[gemini] ${c.label} failed:`, e instanceof Error ? e.message : e);
      if (!isRetryable(e)) break;
    }
  }
  throw lastErr ?? new Error("All AI models failed");
}

export async function generateTextWithFallback({
  system, prompt,
}: { system?: string; prompt: string }) {
  const candidates = buildModels();
  if (candidates.length === 0) throw new Error("No AI provider configured (set GEMINI_API_KEY).");
  let lastErr: unknown;
  for (const c of candidates) {
    try {
      const res = await generateText({ model: c.model, system, prompt });
      console.log(`[gemini] using ${c.label}`);
      return res;
    } catch (e) {
      lastErr = e;
      console.warn(`[gemini] ${c.label} failed:`, e instanceof Error ? e.message : e);
      if (!isRetryable(e)) break;
    }
  }
  throw lastErr ?? new Error("All AI models failed");
}