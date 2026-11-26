import { cn } from "cn";
import type { EndpointPreview } from "../types";

interface EndpointValueProps {
  preview: EndpointPreview;
  size?: "md" | "lg";
  className?: string;
}

const VALUE_SIZES = {
  md: "text-2xl",
  lg: "text-5xl md:text-6xl",
} as const;

/** The current value of an endpoint in human terms: big number, unit, and a short caption. */
export function EndpointValue({ preview, size = "md", className }: EndpointValueProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <p className="flex items-baseline gap-1.5">
        <span
          className={cn("font-heading text-ink-950 leading-none tabular-nums", VALUE_SIZES[size])}
        >
          {preview.value}
        </span>
        {preview.unit ? <span className="text-ink-500 text-sm">{preview.unit}</span> : null}
      </p>
      <p className="truncate text-muted-foreground text-xs">{preview.caption}</p>
    </div>
  );
}
