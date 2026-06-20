import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { computeChart, STATE_COORDS, DEFAULT_COORDS } from "@/lib/astrology/engine";

type Body = { messages?: UIMessage[]; threadId?: string };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization");
        if (!auth?.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401 });
        const token = auth.slice(7);

        const supaUrl = process.env.SUPABASE_URL!;
        const pubKey = process.env.SUPABASE_PUBLISHABLE_KEY!;
        const supabase = createClient<Database>(supaUrl, pubKey, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: userData, error: uerr } = await supabase.auth.getUser(token);
        if (uerr || !userData.user) return new Response("Unauthorized", { status: 401 });
        const userId = userData.user.id;

        const { messages, threadId } = (await request.json()) as Body;
        if (!threadId || !Array.isArray(messages)) return new Response("Bad request", { status: 400 });

        // Verify thread + load astrologer
        const { data: thread } = await supabase
          .from("chat_threads")
          .select("id, astrologer_id, free_consumed, astrologer:astrologers(rate_paise_per_min, system_prompt, display_name)")
          .eq("id", threadId).eq("user_id", userId).maybeSingle();
        if (!thread) return new Response("Thread not found", { status: 404 });

        const astro = thread.astrologer as unknown as { rate_paise_per_min: number; system_prompt: string; display_name: string };

        // Debit (free first message, then per-minute rate per user message)
        const { data: newBal, error: derr } = await supabase.rpc("wallet_debit_for_chat", {
          _user_id: userId,
          _thread_id: threadId,
          _astrologer_id: thread.astrologer_id,
          _rate_paise: astro.rate_paise_per_min,
        });
        if (derr) return new Response(derr.message, { status: 500 });
        if (newBal === null) {
          return new Response(JSON.stringify({ error: "insufficient_balance" }), { status: 402, headers: { "content-type": "application/json" } });
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

        let chartCtx = "Birth details not yet provided.";
        if (p?.birth_year) {
          const [hh, mm] = (p.birth_time ?? "12:00:00").split(":").map(Number);
          const coords = (p.state && STATE_COORDS[p.state]) || DEFAULT_COORDS;
          const c = computeChart({
            year: p.birth_year, month: p.birth_month!, day: p.birth_day!,
            hour: p.birth_time_known ? (hh ?? 12) : 12,
            minute: p.birth_time_known ? (mm ?? 0) : 0,
            lat: coords.lat, lon: coords.lon, timeKnown: !!p.birth_time_known,
          });
          chartCtx = `Native: ${p.full_name ?? ""} (${p.gender ?? "n/a"}), born ${p.birth_day}/${p.birth_month}/${p.birth_year}${p.birth_time_known ? ` ${p.birth_time}` : " (time unknown)"} in ${p.state ?? "India"}.
Moon Sign (Rashi): ${c.moonRashi.sanskrit} / ${c.moonRashi.name}
Sun Sign: ${c.sunRashi.sanskrit}
Nakshatra: ${c.nakshatra.name}, pada ${c.nakshatra.pada}, lord ${c.nakshatra.lord}, KP sub-lord ${c.nakshatra.subLord}
Ascendant (Lagna): ${c.ascendant?.sanskrit ?? "unknown (birth time missing)"}
Hellenistic sect: ${c.hellenistic.sect}, Lot of Fortune in: ${c.hellenistic.lotOfFortune ?? "n/a"}
Lahiri ayanamsa used: ${c.ayanamsa}°`;
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("LOVABLE_API_KEY missing", { status: 500 });
        const gateway = createLovableAiGatewayProvider(key);

        const system = `${astro.system_prompt}

You are speaking as ${astro.display_name}. Use ONLY Vedic/KP/Hellenistic/Tarot/Numerology frameworks — never western pop astrology generalities. Be warm, specific, and addictive: reference the native's actual chart facts below. Keep replies under 180 words unless the user asks for depth. Always end with one short follow-up question to keep the dialogue going.

--- NATIVE'S CHART (computed server-side, treat as authoritative) ---
${chartCtx}`;

        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system,
          messages: await convertToModelMessages(messages),
        });

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
        });
      },
    },
  },
});