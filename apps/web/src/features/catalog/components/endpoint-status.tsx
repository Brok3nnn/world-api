import { cn } from "cn";
import { STATUS_LABELS } from "../constants";
import type { EndpointStatus as EndpointStatusValue } from "../types";

interface EndpointStatusProps {
  status: EndpointStatusValue;
  className?: string;
}

const DOT_COLORS: Record<EndpointStatusValue, string> = {
  live: "bg-mint-600",
  degraded: "bg-amber-600",
  building: "bg-cobalt-500 animate-pulse-dot",
};

export function EndpointStatus({ status, className }: EndpointStatusProps) {
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 text-muted-foreground text-xs", className)}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", DOT_COLORS[status])} />
      {STATUS_LABELS[status]}
    </span>
  );
}
