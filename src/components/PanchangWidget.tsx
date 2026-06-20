import { useMemo } from "react";
import { computePanchang } from "@/lib/astrology";

export function PanchangWidget() {
  const p = useMemo(() => computePanchang(new Date()), []);
  return (
    <div className="glass mt-4 grid grid-cols-3 gap-2 rounded-2xl p-3 text-center text-[10.5px]">
      <Pill label="Tithi" value={`${p.tithi}`} />
      <Pill label="Nakshatra" value={p.nakshatra} />
      <Pill label="Yoga" value={p.yoga} />
      <Pill label="Karana" value={p.karana} />
      <Pill label="Vara" value={p.vara} />
      <Pill label="Sun · Moon" value={`${p.sunSign} · ${p.moonSign}`} />
    </div>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/3 px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display mt-0.5 text-accent">{value}</div>
    </div>
  );
}