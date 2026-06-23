import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(supabase: ReturnType<typeof Object>, userId: string) {
  // Use the security-definer has_role function
  const { data, error } = await (supabase as { rpc: (n: string, p: unknown) => Promise<{ data: boolean; error: { message: string } | null }> })
    .rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profiles } = await supabaseAdmin.from("profiles")
      .select("id, full_name, phone, state, onboarded, created_at")
      .order("created_at", { ascending: false }).limit(200);
    const { data: balances } = await supabaseAdmin.from("wallet_balances").select("user_id, balance_paise");
    const balMap = new Map((balances ?? []).map((b) => [b.user_id, b.balance_paise]));
    return (profiles ?? []).map((p) => ({ ...p, balance_paise: balMap.get(p.id) ?? 0 }));
  });

export const adminCreditWallet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid(), amountInr: z.number().int().positive(), note: z.string().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: newBal, error } = await context.supabase.rpc("wallet_admin_credit", {
      _target_user: data.userId, _amount_paise: data.amountInr * 100, _note: data.note ?? undefined,
    });
    if (error) throw new Error(error.message);
    return { balancePaise: newBal as number };
  });

export const adminListAstrologers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data } = await context.supabase.from("astrologers")
      .select("id, slug, display_name, rate_paise_per_min, free_minutes, is_active, is_recommended, priority, systems, languages, specialties, rating, experience_years, bio")
      .order("priority", { ascending: false });
    return data ?? [];
  });

export const adminUpdateAstrologer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid(),
    rate_paise_per_min: z.number().int().min(100).max(20000).optional(),
    free_minutes: z.number().int().min(0).max(60).optional(),
    is_active: z.boolean().optional(),
    is_recommended: z.boolean().optional(),
    systems: z.array(z.enum(["parashara","kp","hellenistic"])).optional(),
    languages: z.array(z.string().min(1).max(40)).max(10).optional(),
    specialties: z.array(z.string().min(1).max(40)).max(10).optional(),
    rating: z.number().min(1).max(5).optional(),
    experience_years: z.number().int().min(0).max(80).optional(),
    bio: z.string().max(2000).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { id, ...patch } = data;
    const { error } = await context.supabase.from("astrologers").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminGetStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [u, t, m, txn] = await Promise.all([
      supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("chat_threads").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("chat_messages").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("wallet_transactions").select("amount_paise").eq("kind", "chat_debit"),
    ]);
    const revenuePaise = -(txn.data ?? []).reduce((s, r) => s + r.amount_paise, 0);
    return {
      users: u.count ?? 0,
      threads: t.count ?? 0,
      messages: m.count ?? 0,
      revenueInr: Math.round(revenuePaise / 100),
    };
  });

export const adminCreateAstrologer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/),
    display_name: z.string().min(2).max(80),
    tagline: z.string().max(160).optional(),
    bio: z.string().max(2000).optional(),
    primary_system: z.enum(["vedic","kp","hellenistic","tarot","numerology","combined"]),
    rate_paise_per_min: z.number().int().min(100).max(20000),
    free_minutes: z.number().int().min(0).max(60).default(2),
    specialties: z.array(z.string().min(1).max(40)).max(10).default([]),
    languages: z.array(z.string().min(1).max(40)).max(10).default(["English","Hindi"]),
    systems: z.array(z.enum(["parashara","kp","hellenistic"])).default(["parashara"]),
    experience_years: z.number().int().min(0).max(80).default(5),
    rating: z.number().min(1).max(5).default(4.7),
    avatar_emoji: z.string().max(8).default("🔮"),
    avatar_gradient: z.string().max(80).default("from-violet-500 to-fuchsia-500"),
    system_prompt: z.string().min(20).max(4000),
    is_recommended: z.boolean().default(false),
    is_active: z.boolean().default(true),
    priority: z.number().int().min(0).max(1000).default(0),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error, data: row } = await context.supabase.from("astrologers").insert(data).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const adminDeleteAstrologer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("astrologers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDebitWallet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    userId: z.string().uuid(), amountInr: z.number().int().positive(), note: z.string().max(200).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: bal } = await supabaseAdmin.from("wallet_balances").select("balance_paise").eq("user_id", data.userId).maybeSingle();
    const current = bal?.balance_paise ?? 0;
    const debit = data.amountInr * 100;
    if (current < debit) throw new Error("Insufficient balance");
    const newBal = current - debit;
    const { error: upErr } = await supabaseAdmin.from("wallet_balances").update({ balance_paise: newBal }).eq("user_id", data.userId);
    if (upErr) throw new Error(upErr.message);
    await supabaseAdmin.from("wallet_transactions").insert({
      user_id: data.userId, kind: "admin_debit", amount_paise: -debit, balance_after_paise: newBal,
      meta: { admin_id: context.userId, note: data.note ?? "" },
    });
    return { balancePaise: newBal };
  });

export const adminResetThreadFreeWindow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid(), astrologerId: z.string().uuid().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("chat_threads")
      .update({ free_started_at: null, last_charge_at: null, free_consumed: false })
      .eq("user_id", data.userId);
    if (data.astrologerId) q = q.eq("astrologer_id", data.astrologerId);
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListRecentThreads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("chat_threads")
      .select("id, user_id, astrologer_id, message_count, last_message_at, free_consumed")
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(50);
    return data ?? [];
  });