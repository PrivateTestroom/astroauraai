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

  const linkClass = (to: string) => {
    const active = pathname === to || pathname.startsWith(to + "/");
    return { active };
  };

  return (
    <>
      {/* Mobile: bottom tab bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-background/90 backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="mx-auto flex max-w-md items-stretch justify-between px-1">
          {items.map(({ to, label, icon: Icon }) => {
            const { active } = linkClass(to);
            return (
              <li key={to} className="flex-1">
                <Link
                  to={to}
                  aria-label={label}
                  className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium leading-none transition ${
                    active ? "text-accent" : "text-muted-foreground"
                  }`}
                >
                  <span
                    className={`flex h-8 w-12 items-center justify-center rounded-full transition ${
                      active ? "bg-accent/15" : ""
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${active ? "drop-shadow-[0_0_8px_rgba(201,162,75,0.7)]" : ""}`}
                    />
                  </span>
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Desktop: side rail */}
      <nav className="fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 rounded-2xl border border-white/10 bg-background/85 px-1.5 py-2 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl lg:block">
        <ul className="flex flex-col items-stretch gap-0.5">
          {items.map(({ to, label, icon: Icon }) => {
            const { active } = linkClass(to);
            return (
              <li key={to}>
                <Link
                  to={to}
                  aria-label={label}
                  className={`flex flex-col items-center gap-0.5 rounded-xl px-2.5 py-2 text-[9px] font-medium leading-none transition ${
                    active ? "bg-white/5 text-accent" : "text-muted-foreground"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${active ? "drop-shadow-[0_0_8px_rgba(201,162,75,0.7)]" : ""}`}
                  />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
