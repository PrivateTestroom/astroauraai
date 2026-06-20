import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const startChatThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ astrologerSlug: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: astro, error: aerr } = await supabase
      .from("astrologers").select("id, display_name, rate_paise_per_min, avatar_emoji, avatar_gradient")
      .eq("slug", data.astrologerSlug).maybeSingle();
    if (aerr || !astro) throw new Error("Astrologer not found");

    const { data: tid, error: terr } = await supabase.rpc("get_or_create_thread", { _astrologer_id: astro.id });
    if (terr || !tid) throw new Error(terr?.message ?? "Failed to start thread");

    const { data: msgs } = await supabase
      .from("chat_messages").select("id, role, parts, created_at")
      .eq("thread_id", tid).order("created_at", { ascending: true });

    const { data: thread } = await supabase
      .from("chat_threads").select("free_consumed, message_count").eq("id", tid).maybeSingle();

    const { data: bal } = await supabase
      .from("wallet_balances").select("balance_paise").eq("user_id", context.userId).maybeSingle();

    return {
      threadId: tid as string,
      astrologer: astro,
      messages: (msgs ?? []).map((m) => ({
        id: m.id, role: m.role as "user" | "assistant",
        parts: m.parts as Array<{ type: string; text?: string }>,
      })),
      freeConsumed: !!thread?.free_consumed,
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