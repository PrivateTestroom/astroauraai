import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Sparkles, Wallet, User, Compass } from "lucide-react";

const items = [
  { to: "/home", label: "Astrologers", icon: Home },
  { to: "/horoscope", label: "Today", icon: Sparkles },
  { to: "/kundli", label: "Kundli", icon: Compass },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/profile", label: "You", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string) => pathname === to || pathname.startsWith(to + "/");

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="mx-auto flex max-w-md items-stretch justify-between px-2">
          {items.map(({ to, label, icon: Icon }) => {
            const active = isActive(to);
            return (
              <li key={to} className="flex-1">
                <Link
                  to={to}
                  aria-label={label}
                  className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium leading-none transition ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
                      active ? "bg-primary/15" : ""
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <nav className="fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 rounded-2xl border border-border bg-card/95 px-1.5 py-2 shadow-[0_8px_32px_-12px_oklch(0.45_0.05_55_/_0.2)] backdrop-blur-xl lg:block">
        <ul className="flex flex-col items-stretch gap-0.5">
          {items.map(({ to, label, icon: Icon }) => {
            const active = isActive(to);
            return (
              <li key={to}>
                <Link
                  to={to}
                  aria-label={label}
                  className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2.5 text-[10px] font-medium leading-none transition ${
                    active ? "bg-primary/12 text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
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
