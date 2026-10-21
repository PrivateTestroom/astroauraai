import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useLocation,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import "../lib/fonts";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { MessageCircleQuestion, X } from "lucide-react";
import { InstallPrompt } from "@/components/InstallPrompt";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-105"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error as Error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-105"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#FBF8F1" },
      { title: "AstroAura AI — Talk to AI Astrologers" },
      { name: "description", content: "Chat with AI astrologers trained in Vedic, KP, Hellenistic and Tarot. Daily horoscope, birth chart, real spiritual guidance." },
      { property: "og:title", content: "AstroAura AI — Talk to AI Astrologers" },
      { property: "og:description", content: "Chat with AI astrologers trained in Vedic, KP, Hellenistic and Tarot. Daily horoscope, birth chart, real spiritual guidance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "AstroAura AI — Talk to AI Astrologers" },
      { name: "twitter:description", content: "Chat with AI astrologers trained in Vedic, KP, Hellenistic and Tarot. Daily horoscope, birth chart, real spiritual guidance." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", type: "image/png", href: "/icon-512.png" },
      { rel: "apple-touch-icon", href: "/icon-512.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="star-bg">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      (async () => {
        if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
        router.invalidate();
        if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
      })();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <ScrollToTop />
      <Outlet />
      <SupportButton />
      <InstallPrompt />
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}

function ScrollToTop() {
  const pathname = useLocation({ select: (location) => location.pathname });
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname]);
  return null;
}

function SupportButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Support"
        className="fixed right-4 top-4 z-[100] flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/95 text-primary shadow-lg backdrop-blur transition hover:scale-105 active:scale-95 lg:right-6 lg:top-6"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircleQuestion className="h-5 w-5" />}
      </button>
      {open && (
        <div className="fixed right-4 top-16 z-[100] w-72 rounded-2xl border border-border bg-card/95 p-4 shadow-xl backdrop-blur lg:right-6 lg:top-20">
          <h3 className="font-display text-sm font-semibold text-foreground">Need help?</h3>
          <p className="mt-1 text-xs text-muted-foreground">We're here to help with any questions about your readings, payments, or account.</p>
          <a
            href="https://wa.link/eyvvsn"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-105"
          >
            <MessageCircleQuestion className="h-4 w-4" /> Chat on WhatsApp
          </a>
          <button
            onClick={() => setOpen(false)}
            className="mt-2 w-full text-center text-xs text-muted-foreground"
          >
            Close
          </button>
        </div>
      )}
    </>
  );
}
