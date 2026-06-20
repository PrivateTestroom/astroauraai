import { createFileRoute } from "@tanstack/react-router";
import { type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { resolveCoords } from "@/lib/astrology/engine";
import { buildAstrologyContext, bundleToPrompt, type AstroSystem } from "@/lib/ai/astrology-context";
import { streamChatWithFallback } from "@/lib/gemini.server";

type Body = { messages?: UIMessage[]; threadId?: string };

function jsonError(error: string, message: string, status: number) {
  return new Response(JSON.stringify({ error, message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization");
        if (!auth?.startsWith("Bearer ")) return jsonError("unauthorized", "Please sign in again.", 401);
        const token = auth.slice(7);

        const supaUrl = process.env.SUPABASE_URL!;
        const pubKey = process.env.SUPABASE_PUBLISHABLE_KEY!;
        const supabase = createClient<Database>(supaUrl, pubKey, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: userData, error: uerr } = await supabase.auth.getUser(token);
        if (uerr || !userData.user) return jsonError("unauthorized", "Session expired. Please sign in again.", 401);
        const userId = userData.user.id;

        const { messages, threadId } = (await request.json()) as Body;
        if (!threadId || !Array.isArray(messages)) return jsonError("bad_request", "Invalid chat request.", 400);

        // Verify thread + load astrologer
        const { data: thread } = await supabase
          .from("chat_threads")
          .select("id, astrologer_id, free_consumed, astrologer:astrologers(rate_paise_per_min, system_prompt, display_name, systems, specialties, languages, free_minutes)")
          .eq("id", threadId).eq("user_id", userId).maybeSingle();
        if (!thread) return jsonError("thread_not_found", "Chat thread not found.", 404);

        const astro = thread.astrologer as unknown as {
          rate_paise_per_min: number; system_prompt: string; display_name: string;
          systems?: string[]; specialties?: string[]; languages?: string[]; free_minutes?: number;
        };
        const systems: AstroSystem[] = ((astro.systems?.length ? astro.systems : ["parashara"]) as string[])
          .filter((s): s is AstroSystem => s === "parashara" || s === "kp" || s === "hellenistic");
        const freeMinutes = astro.free_minutes ?? 2;

        // Debit (free first message, then per-minute rate per user message)
        const { data: newBal, error: derr } = await supabase.rpc("wallet_debit_for_chat", {
          _user_id: userId,
          _thread_id: threadId,
          _astrologer_id: thread.astrologer_id,
          _rate_paise: astro.rate_paise_per_min,
        });
        if (derr) return jsonError("debit_failed", derr.message || "Wallet error.", 500);
        if (newBal === null) {
          return jsonError("insufficient_balance", `Your free ${freeMinutes} minute${freeMinutes === 1 ? "" : "s"} are over and your wallet is empty. Please top up to continue.`, 402);
        }

        // Save the latest user message (last in array)
        const last = messages[messages.length - 1];
        if (last?.role === "user") {
          await supabase.from("chat_messages").insert({
            thread_id: threadId, user_id: userId, role: "user", parts: last.parts as never,
          });
        }

        // Load birth profile + compute chart context
        const { data: p } = await supabase.from("profiles")
          .select("full_name,gender,birth_year,birth_month,birth_day,birth_time,birth_time_known,state,city")
          .eq("id", userId).maybeSingle();

        let chartCtx = "Birth details not yet provided. Ask the seeker politely for their date, time (if known), and place of birth so you can read their chart accurately.";
        if (p?.birth_year) {
          const [hh, mm] = (p.birth_time ?? "12:00:00").split(":").map(Number);
          const coords = resolveCoords(p.city, p.state);
          const bundle = buildAstrologyContext({
            year: p.birth_year, month: p.birth_month!, day: p.birth_day!,
            hour: p.birth_time_known ? (hh ?? 12) : 12,
            minute: p.birth_time_known ? (mm ?? 0) : 0,
            lat: coords.lat, lon: coords.lon, timeKnown: !!p.birth_time_known,
          }, systems);
          chartCtx = `Native: ${p.full_name ?? ""} (${p.gender ?? "n/a"}), born ${p.birth_day}/${p.birth_month}/${p.birth_year}${p.birth_time_known ? ` ${p.birth_time}` : " (time unknown)"} in ${p.state ?? "India"}.\n\n${bundleToPrompt(bundle, systems)}`;
        }

        let result;
        try {
          const sysList = systems.map((s) => s === "parashara" ? "Parashara/Vedic Jyotish" : s === "kp" ? "KP (Krishnamurti Paddhati)" : "Hellenistic/Western").join(" + ");
          const system = `${astro.system_prompt}

You are speaking AS ${astro.display_name}, a master astrologer who reads strictly through ${sysList}. Your voice is warm, grounded, addictive, and specific.

RULES:
- Always reference the seeker's actual chart facts from the AUTHORITATIVE CHART block below — never generic pop astrology.
- When multiple systems are present, synthesize them: form your own interpretation from each, then deliver ONE unified answer that names the strongest signal from each system used.
- If birth time is unknown and an answer needs the ascendant, say so and offer a Moon-chart reading instead.
- Languages you may switch to if the seeker writes in them: ${(astro.languages ?? ["English","Hindi"]).join(", ")}. Mirror the seeker's language.
- Specialties to lean into: ${(astro.specialties ?? ["Love","Career"]).join(", ")}.
- Keep replies under 180 words unless the seeker asks for depth.
- End every reply with one short follow-up question to keep the dialogue going.
- Never claim to be a human astrologer. If asked, say you're an AI astrologer trained on classical texts.

--- AUTHORITATIVE CHART (computed server-side, do not contradict) ---
${chartCtx}`;

          result = await streamChatWithFallback({ system, messages });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "AI gateway error";
          return jsonError("ai_unavailable", msg, 502);
        }

        return result.toUIMessageStreamResponse({
          originalMessages: messages,
          onFinish: async ({ messages: finalMessages }) => {
            const assistant = finalMessages[finalMessages.length - 1];
            if (assistant?.role === "assistant") {
              await supabase.from("chat_messages").insert({
                thread_id: threadId, user_id: userId, role: "assistant", parts: assistant.parts as never,
              });
            }
          },
          onError: (err) => {
            const msg = err instanceof Error ? err.message : "AI stream failed";
            return msg;
          },
        });
      },
    },
  },
});