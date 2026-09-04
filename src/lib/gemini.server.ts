import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, generateText, type LanguageModel, type UIMessage, convertToModelMessages } from "ai";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

// Ordered fallback chain — verified live against the Gemini API.
// Older ids (2.0-flash, 1.5-flash, 2.5-flash-lite) are retired and 404 now.
const USER_KEY_MODELS = ["gemini-2.5-flash", "gemini-3.5-flash-lite"] as const;

// Lovable AI Gateway backup (no user quota) — used when the personal key is
// exhausted or the Google endpoint is unavailable.
const GATEWAY_MODELS = ["google/gemini-2.5-flash", "google/gemini-2.5-flash-lite"] as const;

function buildModels(): { label: string; model: LanguageModel }[] {
  const out: { label: string; model: LanguageModel }[] = [];
  const userKey = process.env.GEMINI_API_KEY;
  if (userKey) {
    const google = createGoogleGenerativeAI({ apiKey: userKey });
    for (const id of USER_KEY_MODELS) out.push({ label: `user:${id}`, model: google(id) });
  }
  const gatewayKey = process.env.LOVABLE_API_KEY;
  if (gatewayKey) {
    const gw = createLovableAiGatewayProvider(gatewayKey);
    for (const id of GATEWAY_MODELS) out.push({ label: `gateway:${id}`, model: gw(id) });
  }
  return out;
}

function isRetryable(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return /404|not.?found|429|quota|rate.?limit|exhaust|503|overload|unavailable|500|timeout/.test(msg);
}

export async function streamChatWithFallback({
  system, messages,
}: { system: string; messages: UIMessage[] }) {
  const candidates = buildModels();
  if (candidates.length === 0) throw new Error("No AI provider configured.");

  const modelMessages = await convertToModelMessages(messages);
  let lastErr: unknown;
  for (const c of candidates) {
    try {
      // Cheap 1-token probe so a retired / quota-exhausted model fails here,
      // before any SSE bytes are committed to the client.
      await generateText({ model: c.model, prompt: "ok", maxOutputTokens: 1 });
      const result = streamText({ model: c.model, system, messages: modelMessages });
      console.log(`[ai] using ${c.label}`);
      return result;
    } catch (e) {
      lastErr = e;
      console.warn(`[ai] ${c.label} failed:`, e instanceof Error ? e.message : e);
    }
  }

  throw lastErr ?? new Error("All AI models failed");
}

export async function generateTextWithFallback({
  system, prompt,
}: { system?: string; prompt: string }) {
  const candidates = buildModels();
  if (candidates.length === 0) throw new Error("No AI provider configured.");
  let lastErr: unknown;
  for (const c of candidates) {
    try {
      const res = await generateText({ model: c.model, system, prompt });
      console.log(`[ai] using ${c.label}`);
      return res;
    } catch (e) {
      lastErr = e;
      console.warn(`[ai] ${c.label} failed:`, e instanceof Error ? e.message : e);
    }
  }
  throw lastErr ?? new Error("All AI models failed");
}
