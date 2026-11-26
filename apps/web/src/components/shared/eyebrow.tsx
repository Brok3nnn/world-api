import { cn } from "cn";
import type { ReactNode } from "react";

interface EyebrowProps {
  children: ReactNode;
  /** Shows a pulsing dot that signals live data. */
  live?: boolean;
  tone?: "default" | "inverse";
  className?: string;
}

/** Short colored label placed above titles and sections. */
export function Eyebrow({ children, live = false, tone = "default", className }: EyebrowProps) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-2 font-medium text-sm",
        tone === "inverse" ? "text-white/85" : "text-violet-600",
        className,
      )}
    >
      {live ? (
        <span aria-hidden className="relative flex size-2">
          <span
            className={cn(
              "absolute inset-0 rounded-full opacity-60 motion-safe:animate-ping",
              tone === "inverse" ? "bg-white" : "bg-violet-500",
            )}
          />
          <span
            className={cn(
              "relative size-2 rounded-full",
              tone === "inverse" ? "bg-white" : "bg-violet-600",
            )}
          />
        </span>
      ) : null}
      {children}
    </p>
  );
}
