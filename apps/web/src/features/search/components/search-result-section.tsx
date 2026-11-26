import { type ReactNode, useId } from "react";
import { formatNumber } from "@/lib/format";

interface SearchResultSectionProps {
  title: string;
  count: number;
  children: ReactNode;
}

/** A titled group of search results with its match count. */
export function SearchResultSection({ title, count, children }: SearchResultSectionProps) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-4">
      <h2 id={titleId} className="flex items-baseline gap-2 font-heading text-2xl text-ink-950">
        {title}
        <span className="text-muted-foreground text-sm tabular-nums">{formatNumber(count)}</span>
      </h2>
      {children}
    </section>
  );
}
