import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeChart, resolveCoords, type ComputedChart } from "./astrology/engine";

export const getMyChart = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ComputedChart | null> => {
    const { data: p } = await context.supabase
      .from("profiles")
      .select("birth_year,birth_month,birth_day,birth_time,birth_time_known,state,city")
      .eq("id", context.userId)
      .maybeSingle();
    if (!p?.birth_year || !p.birth_month || !p.birth_day) return null;
    const [h, m] = (p.birth_time ?? "12:00:00").split(":").map(Number);
    const coords = resolveCoords(p.city, p.state);
    return computeChart({
      year: p.birth_year, month: p.birth_month, day: p.birth_day,
      hour: p.birth_time_known ? (h ?? 12) : 12,
      minute: p.birth_time_known ? (m ?? 0) : 0,
      lat: coords.lat, lon: coords.lon,
      timeKnown: !!p.birth_time_known,
    });
  });