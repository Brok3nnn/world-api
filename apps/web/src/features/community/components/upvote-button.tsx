"use client";

import { cn } from "cn";
import { ChevronUpIcon } from "lucide-react";
import { useState } from "react";
import { formatCompactNumber } from "@/lib/format";

interface UpvoteButtonProps {
  /** What is being voted on, for the accessible name. */
  subject: string;
  initialVotes: number;
}

/** Vertical vote pill. Local state until accounts and persistence exist. */
export function UpvoteButton({ subject, initialVotes }: UpvoteButtonProps) {
  const [voted, setVoted] = useState(false);
  const votes = initialVotes + (voted ? 1 : 0);

  return (
    <button
      type="button"
      aria-pressed={voted}
      aria-label={`${voted ? "Remove upvote from" : "Upvote"} “${subject}”`}
      onClick={() => setVoted((current) => !current)}
      className={cn(
        "flex w-14 shrink-0 flex-col items-center gap-0.5 rounded-xl py-2 text-ink-700 text-xs tabular-nums ring-1 ring-border transition-colors outline-none hover:bg-ink-50 focus-visible:ring-3 focus-visible:ring-ring/50",
        voted && "bg-lilac-50 text-violet-700 ring-lilac-100 hover:bg-lilac-50",
      )}
    >
      <ChevronUpIcon aria-hidden className="size-4" />
      {formatCompactNumber(votes)}
    </button>
  );
}
