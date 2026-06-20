import { Sparkles } from "lucide-react";

/**
 * Quiet, elegant loading state — replaces "Preparing your chart…".
 * A slow-rotating gold ring with three orbiting stars; tuned for the
 * deep-cosmic editorial theme.
 */
export function CosmicLoader({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-10">
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 rounded-full border border-accent/30" />
        <div className="absolute inset-0 rounded-full border-t border-accent animate-[spin_3.2s_linear_infinite]" />
        <div className="absolute inset-2 rounded-full border border-accent/15" />
        <div className="absolute inset-2 rounded-full border-b border-accent/70 animate-[spin_4.6s_linear_infinite_reverse]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-accent animate-pulse" />
        </div>
      </div>
      {label ? (
        <div className="font-display text-sm tracking-wide text-muted-foreground">{label}</div>
      ) : null}
    </div>
  );
}