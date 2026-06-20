import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { MAJOR_ARCANA } from "@/lib/tarot/deck";
import { generateTextWithFallback } from "@/lib/gemini.server";

const DrawSchema = z.object({
  question: z.string().trim().max(500).optional().default(""),
  picks: z.array(z.object({
    cardId: z.number().int().min(0).max(21),
    position: z.enum(["Past", "Present", "Future"]),
    reversed: z.boolean(),
  })).length(3),
});

export const interpretTarot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DrawSchema.parse(d))
  .handler(async ({ data }) => {
    const cards = data.picks.map((p) => {
      const c = MAJOR_ARCANA.find((m) => m.id === p.cardId);
      if (!c) throw new Error(`Unknown card ${p.cardId}`);
      return { ...p, card: c };
    });

    const block = cards.map(({ position, reversed, card }) =>
      `**${position} — ${card.name}${reversed ? " (Reversed)" : ""}**\n` +
      `Keywords: ${card.keywords.join(", ")}\n` +
      `Meaning: ${reversed ? card.reversed : card.upright}`
    ).join("\n\n");

    const question = data.question?.trim() || "What does the seeker most need to see right now?";

    const system = `You are a seasoned tarot reader trained in the Rider–Waite–Smith tradition. Read the spread the seeker drew — never invent extra cards, never change the cards or their orientations. Speak warmly, plainly, and specifically. Avoid generic horoscope language.

Format:
1. One sentence opening that acknowledges the question.
2. **Past** — 2–3 sentences tying the card's symbolism to what likely shaped the situation.
3. **Present** — 2–3 sentences on the current energy and what the card is asking of them right now.
4. **Future** — 2–3 sentences on the most probable unfolding if the present energy continues, with one concrete piece of guidance.
5. **The thread** — one short paragraph weaving all three cards into a single story.

Honour reversals as nuance (blocked, internalised, or shadow expression of the same energy) — not as bad omens. Never predict death, illness, or specific dates.`;

    const prompt = `Seeker's question: "${question}"\n\nThe three cards they drew (in order Past, Present, Future):\n\n${block}\n\nGive the reading.`;

    const { text } = await generateTextWithFallback({ system, prompt });
    return { reading: text, cards };
  });