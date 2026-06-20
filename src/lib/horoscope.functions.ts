import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateTextWithFallback } from "./gemini.server";
import { computeChart, resolveCoords } from "./astrology/engine";

function todayIST(): string {
  const d = new Date(Date.now() + 5.5 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
}

export const getDailyHoroscope = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const date = todayIST();

    const { data: cached } = await supabase
      .from("horoscope_cache")
      .select("body")
      .eq("user_id", userId)
      .eq("for_date", date)
      .maybeSingle();
    if (cached?.body) return { date, ...(cached.body as Record<string, string>) };

    const { data: p } = await supabase
      .from("profiles")
      .select("full_name,birth_year,birth_month,birth_day,birth_time,birth_time_known,state,city")
      .eq("id", userId).maybeSingle();
    if (!p?.birth_year) {
      return { date, summary: "Complete your birth details to unlock your daily horoscope.", love: "", career: "", health: "", lucky: "" };
    }
    const [hh, mm] = (p.birth_time ?? "12:00:00").split(":").map(Number);
    const coords = resolveCoords(p.city, p.state);
    const chart = computeChart({
      year: p.birth_year, month: p.birth_month!, day: p.birth_day!,
      hour: p.birth_time_known ? (hh ?? 12) : 12,
      minute: p.birth_time_known ? (mm ?? 0) : 0,
      lat: coords.lat, lon: coords.lon, timeKnown: !!p.birth_time_known,
    });

    const prompt = `You are a senior Vedic + KP + Hellenistic astrologer giving a real personalized horoscope for ${date} (IST).

Native: ${p.full_name ?? "the seeker"}
Moon sign (Rashi): ${chart.moonRashi.sanskrit} (${chart.moonRashi.name})
Sun sign: ${chart.sunRashi.sanskrit}
Nakshatra: ${chart.nakshatra.name} pada ${chart.nakshatra.pada}, lord ${chart.nakshatra.lord}, sub-lord ${chart.nakshatra.subLord}
Ascendant: ${chart.ascendant?.sanskrit ?? "unknown"}
Hellenistic sect: ${chart.hellenistic.sect}

Return JSON ONLY with keys: summary (2-3 sentences, mystical but practical), love (1 sentence), career (1 sentence), health (1 sentence), lucky (e.g. "Color: Red · Number: 7 · Time: 4–6 PM"). No markdown, no commentary, just the JSON.`;

    const { text } = await generateTextWithFallback({ prompt });
    const jsonStr = text.match(/\{[\s\S]*\}/)?.[0] ?? "{}";
    let body: Record<string, string> = {};
    try { body = JSON.parse(jsonStr); } catch { body = { summary: text.slice(0, 400) }; }

    await supabase.from("horoscope_cache").upsert({
      user_id: userId, for_date: date, body,
    }, { onConflict: "user_id,for_date" });

    return { date, ...body };
  });