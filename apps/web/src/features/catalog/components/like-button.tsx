"use client";

import { cn } from "cn";
import { HeartIcon } from "lucide-react";
import { formatCompactNumber } from "@/lib/format";
import { useEndpointLike } from "../hooks/use-endpoint-like";

interface LikeButtonProps {
  endpointId: string;
  /** Like count before the current visitor's like. */
  baseCount: number;
  /** `glass` sits on images and colored surfaces. */
  tone?: "default" | "glass";
  className?: string;
}

const TONES = {
  default: {
    idle: "bg-ink-50 text-ink-700 ring-1 ring-border hover:bg-ink-100",
    liked: "bg-coral-100 text-coral-500 ring-1 ring-coral-300/50",
  },
  glass: {
    idle: "bg-ink-950/35 text-white ring-1 ring-white/25 backdrop-blur-md hover:bg-ink-950/50",
    liked: "bg-white text-coral-500 ring-1 ring-white",
  },
} as const;

export function LikeButton({
  endpointId,
  baseCount,
  tone = "default",
  className,
}: LikeButtonProps) {
  const { liked, toggle } = useEndpointLike(endpointId);
  const count = baseCount + (liked ? 1 : 0);

  return (
    <button
      type="button"
      aria-pressed={liked}
      aria-label={liked ? "Remove like" : "Like"}
      onClick={toggle}
      className={cn(
        "relative z-10 inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 font-medium text-xs tabular-nums transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        liked ? TONES[tone].liked : TONES[tone].idle,
        className,
      )}
    >
      <HeartIcon aria-hidden className={cn("size-3.5", liked && "fill-current")} />
      {formatCompactNumber(count)}
    </button>
  );
}
