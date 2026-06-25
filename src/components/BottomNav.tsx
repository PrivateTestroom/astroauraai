import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Sparkles, Wallet, User, Compass, Diamond } from "lucide-react";

const items = [
  { to: "/home", label: "Chat", icon: Home },
  { to: "/horoscope", label: "Today", icon: Sparkles },
  { to: "/tarot", label: "Tarot", icon: Diamond },
  { to: "/kundli", label: "Kundli", icon: Compass },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/profile", label: "You", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      className="fixed right-2 top-1/2 z-40 -translate-y-1/2 rounded-2xl border border-white/10 bg-background/85 px-1.5 py-2 backdrop-blur-xl shadow-[0_10px_40px_-12px_rgba(0,0,0,0.8)]"
      style={{ paddingRight: "max(0.375rem, env(safe-area-inset-right))" }}
    >
      <ul className="flex flex-col items-stretch gap-0.5">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || pathname.startsWith(to + "/");
          return (
            <li key={to}>
              <Link
                to={to}
                aria-label={label}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-2.5 py-2 text-[9px] font-medium leading-none transition ${
                  active ? "text-accent bg-white/5" : "text-muted-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "drop-shadow-[0_0_8px_rgba(245,197,24,0.7)]" : ""}`} />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}