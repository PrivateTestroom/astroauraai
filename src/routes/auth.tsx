import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { phoneToEmail, isValidIndianPhone, normalizePhone } from "@/lib/phone-auth";
import { AppLogo } from "@/components/AppLogo";
import { toast } from "sonner";

const EXISTING_ACCOUNT_CODES = new Set(["user_already_exists", "email_exists", "phone_exists"]);

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).default("signin"),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Sign in — AstroAura AI" }] }),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/home" });
  },
  component: AuthPage,
});

function AuthPage() {
  const { mode: initialMode } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => setMode(initialMode), [initialMode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidIndianPhone(phone)) {
      toast.error("Enter a valid 10-digit Indian mobile number");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const normalized = normalizePhone(phone);
      const email = phoneToEmail(normalized);
      if (mode === "signup") {
        const existing = await supabase.auth.signInWithPassword({ email, password });
        if (!existing.error) {
          await supabase.auth.signOut();
          toast.error("This phone number already has an account. Please sign in instead.");
          setMode("signin");
          setPassword("");
          return;
        }
        if (!existing.error.message.toLowerCase().includes("invalid login")) {
          throw existing.error;
        }
        const { data: signUpData, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { phone: normalized, full_name: fullName || null } },
        });
        if (error) {
          if (EXISTING_ACCOUNT_CODES.has(error.code ?? "") || error.message.toLowerCase().includes("already")) {
            toast.error("This phone number already has an account. Please sign in instead.");
            setMode("signin");
            setPassword("");
            return;
          }
          throw error;
        }
        if (signUpData.user && Array.isArray(signUpData.user.identities) && signUpData.user.identities.length === 0) {
          toast.error("This phone number already has an account. Please sign in instead.");
          setMode("signin");
          setPassword("");
          return;
        }
        toast.success("Account created. Welcome!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/home" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg.includes("Invalid login") ? "Wrong phone or password" : msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/home",
      });
      if (result.error) {
        toast.error("Google sign-in failed. Try phone instead.");
        setLoading(false);
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/home" });
    } catch {
      toast.error("Google sign-in failed");
      setLoading(false);
    }
  }

  return (
    <main className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-6 py-10">
      <Link to="/" className="text-xs text-muted-foreground">← Back</Link>
      <div className="mt-6 flex flex-col items-center text-center">
        <AppLogo size={72} />
        <h1 className="font-display mt-4 text-3xl font-bold">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {mode === "signup" ? "First minute free with every astrologer." : "Sign in to continue."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-3">
        {mode === "signup" && (
          <Field label="Your name (optional)">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Priya"
              className="input"
            />
          </Field>
        )}
        <Field label="Phone number">
          <div className="flex items-stretch overflow-hidden rounded-xl border border-white/15 bg-white/5 focus-within:border-primary">
            <span className="flex items-center px-3 text-sm text-muted-foreground">+91</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="numeric"
              maxLength={13}
              placeholder="98765 43210"
              className="flex-1 bg-transparent px-2 py-3 text-base outline-none"
              autoComplete="tel"
              required
            />
          </div>
        </Field>
        <Field label="Password">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="input"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
          />
        </Field>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-2xl bg-primary py-4 font-semibold text-primary-foreground shadow-[0_8px_30px_-8px_rgba(168,85,247,0.7)] transition hover:brightness-110 disabled:opacity-60"
        >
          {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
        </button>
      </form>

      <div className="relative my-6 text-center text-xs text-muted-foreground">
        <span className="bg-background px-3 relative z-10">or</span>
        <div className="absolute inset-x-0 top-1/2 -z-0 h-px bg-white/10" />
      </div>

      <button
        onClick={handleGoogle}
        disabled={loading}
        className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/5 py-3.5 text-sm font-medium transition hover:bg-white/10 disabled:opacity-60"
      >
        <GoogleIcon /> Continue with Google
      </button>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        {mode === "signup" ? "Already have an account?" : "New to AstroAura?"}{" "}
        <button
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          className="font-semibold text-accent underline-offset-2 hover:underline"
        >
          {mode === "signup" ? "Sign in" : "Create one"}
        </button>
      </p>
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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.12-.84 2.07-1.79 2.71v2.25h2.9c1.7-1.56 2.69-3.86 2.69-6.6z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.25c-.81.54-1.84.86-3.06.86-2.35 0-4.34-1.58-5.05-3.71H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.95 10.72A5.4 5.4 0 0 1 3.66 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l2.99-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .96 4.95L3.95 7.28C4.66 5.15 6.65 3.58 9 3.58z" />
    </svg>
  );
}