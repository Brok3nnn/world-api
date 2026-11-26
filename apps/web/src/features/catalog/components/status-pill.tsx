import { cn } from "cn";
import { STATUS_LABELS } from "../constants";
import type { EndpointStatus } from "../types";

interface StatusPillProps {
  status: EndpointStatus;
  className?: string;
}

const DOT_COLORS: Record<EndpointStatus, string> = {
  live: "bg-mint-400",
  degraded: "bg-amber-400",
  building: "bg-cobalt-300 animate-pulse-dot",
};

/** Frosted status badge for images and colored surfaces. */
export function StatusPill({ status, className }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full bg-ink-950/35 px-2.5 font-medium text-white text-xs ring-1 ring-white/25 backdrop-blur-md",
        className,
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", DOT_COLORS[status])} />
      {STATUS_LABELS[status]}
    </span>
  );
}
