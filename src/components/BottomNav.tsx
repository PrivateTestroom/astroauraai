import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Sparkles, Wallet, User, Compass } from "lucide-react";

const items = [
  { to: "/home", label: "Chat", icon: Home },
  { to: "/horoscope", label: "Today", icon: Sparkles },
  { to: "/kundli", label: "Kundli", icon: Compass },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/profile", label: "You", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-background/85 px-2 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-xl">
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || pathname.startsWith(to + "/");
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-medium transition ${
                  active ? "text-accent" : "text-muted-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "drop-shadow-[0_0_8px_rgba(245,197,24,0.7)]" : ""}`} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}