import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { computeAshtakoot, birthToUtcDate } from "@/lib/astrology";
import { DEFAULT_COORDS } from "@/lib/astrology/engine";

const PartnerSchema = z.object({
  name: z.string().min(1).max(80),
  year: z.number().int().min(1900).max(2100),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  hour: z.number().int().min(0).max(23).default(12),
  minute: z.number().int().min(0).max(59).default(0),
  gender: z.enum(["male","female"]),
});

export const matchKundlis = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ boy: PartnerSchema, girl: PartnerSchema }).parse(d))
  .handler(async ({ data }) => {
    const toDate = (p: z.infer<typeof PartnerSchema>) => birthToUtcDate({
      year: p.year, month: p.month, day: p.day,
      hour: p.hour, minute: p.minute,
      lat: DEFAULT_COORDS.lat, lon: DEFAULT_COORDS.lon, timeKnown: true,
    });
    const r = computeAshtakoot(
      { date: toDate(data.boy), lat: DEFAULT_COORDS.lat, lon: DEFAULT_COORDS.lon, gender: data.boy.gender },
      { date: toDate(data.girl), lat: DEFAULT_COORDS.lat, lon: DEFAULT_COORDS.lon, gender: data.girl.gender },
    );
    return { boy: data.boy.name, girl: data.girl.name, ...r };
  });