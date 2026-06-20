import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/profile";
import { INDIA_STATES, MONTHS, yearsRange, daysInMonth } from "@/lib/india-states";
import { AppLogo } from "@/components/AppLogo";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Tell us about yourself — AstroAura" }] }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const profile = useProfile();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(profile.data?.full_name ?? "");
  const [gender, setGender] = useState<"male" | "female" | "other" | "">(profile.data?.gender ?? "");
  const [state, setState] = useState(profile.data?.state ?? "");
  const [city, setCity] = useState(profile.data?.city ?? "");
  const [year, setYear] = useState<number | "">(profile.data?.birth_year ?? "");
  const [month, setMonth] = useState<number | "">(profile.data?.birth_month ?? "");
  const [day, setDay] = useState<number | "">(profile.data?.birth_day ?? "");
  const [timeKnown, setTimeKnown] = useState(profile.data?.birth_time_known ?? true);
  const [time, setTime] = useState(profile.data?.birth_time ?? "");
  const [saving, setSaving] = useState(false);

  const years = useMemo(() => yearsRange(1930, new Date().getFullYear()), []);
  const days = useMemo(
    () => (year && month ? Array.from({ length: daysInMonth(year as number, month as number) }, (_, i) => i + 1) : []),
    [year, month]
  );

  async function save() {
    if (!fullName.trim()) return toast.error("Please enter your name");
    if (!gender) return toast.error("Please select gender");
    if (!state) return toast.error("Please select your state");
    if (!year || !month || !day) return toast.error("Please enter your date of birth");
    if (timeKnown && !time) return toast.error("Please enter birth time, or mark it unknown");

    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("profiles").upsert({
      id: u.user.id,
      full_name: fullName.trim(),
      gender,
      state,
      city: city.trim() || null,
      birth_year: year as number,
      birth_month: month as number,
      birth_day: day as number,
      birth_time: timeKnown ? (time as string) : null,
      birth_time_known: timeKnown,
      onboarded: true,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await qc.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Your chart is ready");
    navigate({ to: "/home" });
  }

  return (
    <main className="relative z-10 mx-auto max-w-md px-6 py-8">
      <div className="flex items-center gap-3">
        <AppLogo size={44} />
        <div>
          <h1 className="font-display text-2xl font-bold leading-tight">A few details</h1>
          <p className="text-xs text-muted-foreground">So the astrologers can read your chart accurately.</p>
        </div>
      </div>

      <div className="mt-8 space-y-5">
        <Field label="Your name">
          <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" />
        </Field>

        <Field label="Gender">
          <div className="grid grid-cols-3 gap-2">
            {(["male", "female", "other"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                className={`rounded-xl border py-3 text-sm capitalize transition ${
                  gender === g ? "border-primary bg-primary/20 text-foreground" : "border-white/15 bg-white/5 text-muted-foreground"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </Field>

        <Field label="State (India)">
          <select className="select" value={state} onChange={(e) => setState(e.target.value)}>
            <option value="">Select state</option>
            {INDIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>

        <Field label="City (optional)">
          <input className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Mumbai" />
        </Field>

        <Field label="Date of birth">
          <div className="grid grid-cols-3 gap-2">
            <select className="select" value={day} onChange={(e) => setDay(Number(e.target.value) || "")}>
              <option value="">Day</option>
              {days.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select className="select" value={month} onChange={(e) => setMonth(Number(e.target.value) || "")}>
              <option value="">Month</option>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <select className="select" value={year} onChange={(e) => setYear(Number(e.target.value) || "")}>
              <option value="">Year</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </Field>

        <Field label="Birth time">
          <div className="space-y-2">
            <label className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={!timeKnown}
                onChange={(e) => setTimeKnown(!e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-violet-500"
              />
              <span>I don’t know my exact birth time — readings will still be ~80% accurate.</span>
            </label>
            {timeKnown && (
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="input"
              />
            )}
          </div>
        </Field>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="mt-8 w-full rounded-2xl bg-primary py-4 font-semibold text-primary-foreground shadow-[0_8px_30px_-8px_rgba(168,85,247,0.7)] transition hover:brightness-110 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Reveal my chart"}
      </button>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}