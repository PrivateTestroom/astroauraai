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
      .select("id, slug, display_name, rate_paise_per_min, is_active, is_recommended, priority")
      .order("priority", { ascending: false });
    return data ?? [];
  });

export const adminUpdateAstrologer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid(),
    rate_paise_per_min: z.number().int().min(100).max(20000).optional(),
    is_active: z.boolean().optional(),
    is_recommended: z.boolean().optional(),
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