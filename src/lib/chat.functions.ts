import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { computeVedicChart, birthToUtcDate } from "@/lib/astrology";
import { resolveCoords } from "@/lib/astrology/engine";

export const startChatThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ astrologerSlug: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: astro, error: aerr } = await supabase
      .from("astrologers").select("id, display_name, rate_paise_per_min, avatar_emoji, avatar_gradient, specialties")
      .eq("slug", data.astrologerSlug).maybeSingle();
    if (aerr || !astro) throw new Error("Astrologer not found");

    const { data: tid, error: terr } = await supabase.rpc("get_or_create_thread", { _astrologer_id: astro.id });
    if (terr || !tid) throw new Error(terr?.message ?? "Failed to start thread");

    const { data: msgs } = await supabase
      .from("chat_messages").select("id, role, parts, created_at")
      .eq("thread_id", tid).order("created_at", { ascending: true });

    // First-open auto-greeting: if the thread has zero messages, insert a warm,
    // personalized opener from the astrologer so the user never faces an empty screen.
    let messages = msgs ?? [];
    if (messages.length === 0) {
      const { data: p } = await supabase
        .from("profiles")
        .select("full_name,birth_year,birth_month,birth_day,birth_time,birth_time_known,state,city")
        .eq("id", context.userId).maybeSingle();

      const firstName = (p?.full_name ?? "").trim().split(/\s+/)[0] || "";
      const specialty = ((astro as { specialties?: string[] }).specialties ?? [])[0] ?? "your path";
      let greeting = "";
      try {
        if (p?.birth_year) {
          const [hh, mm] = (p.birth_time ?? "12:00:00").split(":").map(Number);
          const coords = resolveCoords(p.city, p.state);
          const utc = birthToUtcDate({
            year: p.birth_year, month: p.birth_month!, day: p.birth_day!,
            hour: p.birth_time_known ? (hh ?? 12) : 12,
            minute: p.birth_time_known ? (mm ?? 0) : 0,
            lat: coords.lat, lon: coords.lon, timeKnown: !!p.birth_time_known,
          });
          const chart = computeVedicChart(utc, coords.lat, coords.lon, !!p.birth_time_known);
          const moon = chart.planets.find((pl) => pl.planet === "Moon");
          const lagna = chart.ascendant?.signSanskrit;
          const hi = firstName ? `Namaste ${firstName} 🙏` : "Namaste 🙏";
          const anchor = lagna
            ? `I see your **${lagna} Lagna** with Moon in **${moon?.nakshatra}** nakshatra — a distinctive signature.`
            : moon
            ? `Your Moon sits in **${moon.nakshatra}** nakshatra (${moon.signSanskrit}) — that's the lens I'll read you through.`
            : `I have your chart open in front of me.`;
          greeting = `${hi} ${anchor}\n\nBefore I go deeper, tell me — what's weighing on you today? Is it about **${specialty.toLowerCase()}**, or something else you'd like me to look at first?`;
        } else {
          const hi = firstName ? `Namaste ${firstName} 🙏` : "Namaste 🙏";
          greeting = `${hi} I'm ${astro.display_name}. Before I open your chart, share your **date, time (if known), and place of birth** — that's what lets me read you precisely instead of generally.\n\nAnd tell me what's on your mind — ${specialty.toLowerCase()}, or something specific you're facing?`;
        }
      } catch {
        greeting = `Namaste 🙏 I'm ${astro.display_name}. What would you like me to look at in your chart today?`;
      }

      const parts = [{ type: "text", text: greeting }];
      const { data: inserted } = await supabase.from("chat_messages").insert({
        thread_id: tid, user_id: context.userId, role: "assistant", parts: parts as never,
      }).select("id, role, parts, created_at").maybeSingle();
      if (inserted) messages = [inserted];
    }

    const { data: thread } = await supabase
      .from("chat_threads").select("free_consumed, message_count, free_started_at").eq("id", tid).maybeSingle();

    const { data: bal } = await supabase
      .from("wallet_balances").select("balance_paise").eq("user_id", context.userId).maybeSingle();

    return {
      threadId: tid as string,
      astrologer: astro,
      messages: messages.map((m) => ({
        id: m.id, role: m.role as "user" | "assistant",
        parts: m.parts as Array<{ type: string; text?: string }>,
      })),
      freeConsumed: !!thread?.free_consumed,
      freeStartedAt: (thread as { free_started_at?: string | null } | null)?.free_started_at ?? null,
      balancePaise: bal?.balance_paise ?? 0,
    };
  });

export const listMyThreads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("chat_threads")
      .select("id, last_message_at, message_count, astrologer:astrologers(slug, display_name, avatar_emoji, avatar_gradient, tagline)")
      .order("last_message_at", { ascending: false, nullsFirst: false });
    return data ?? [];
  });