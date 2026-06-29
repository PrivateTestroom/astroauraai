import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const FIRST_DELAY = 15 * 1000;
const REPEAT_DELAY = 15 * 60 * 1000;
const DISMISS_KEY = "aa_install_dismissed_at";
const INSTALLED_KEY = "aa_install_done";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // @ts-expect-error iOS Safari
    window.navigator.standalone === true
  );
}

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone() || localStorage.getItem(INSTALLED_KEY)) return;

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => {
      localStorage.setItem(INSTALLED_KEY, "1");
      setOpen(false);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);

    const showIfDue = () => {
      if (isStandalone()) return;
      setOpen(true);
    };

    const firstTimer = window.setTimeout(showIfDue, FIRST_DELAY);
    const interval = window.setInterval(showIfDue, REPEAT_DELAY);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
      window.clearTimeout(firstTimer);
      window.clearInterval(interval);
    };
  }, []);

  if (!open) return null;

  const handleInstall = async () => {
    if (deferred) {
      try {
        await deferred.prompt();
        const { outcome } = await deferred.userChoice;
        if (outcome === "accepted") {
          localStorage.setItem(INSTALLED_KEY, "1");
        } else {
          localStorage.setItem(DISMISS_KEY, String(Date.now()));
        }
      } catch {
        /* noop */
      }
      setDeferred(null);
      setOpen(false);
    } else if (isIOS()) {
      setIosHint(true);
    } else {
      setOpen(false);
    }
  };

  const handleClose = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setOpen(false);
    setIosHint(false);
  };

  return (
    <div className="fixed inset-x-3 bottom-24 z-[2147483646] mx-auto max-w-md sm:bottom-28">
      <div className="relative overflow-hidden rounded-2xl border border-accent/30 bg-background/95 p-4 shadow-2xl backdrop-blur">
        <button
          onClick={handleClose}
          aria-label="Close"
          className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground hover:bg-secondary"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-3 pr-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <Download className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Install AstroAura</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {iosHint
                ? "Tap the Share icon in Safari, then choose ‘Add to Home Screen’."
                : "Get faster access, offline-ready cosmic guidance, right from your home screen."}
            </p>
            {!iosHint && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleInstall}
                  className="rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-accent-foreground hover:opacity-90"
                >
                  Install
                </button>
                <button
                  onClick={handleClose}
                  className="rounded-full border border-border px-4 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary"
                >
                  Later
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}