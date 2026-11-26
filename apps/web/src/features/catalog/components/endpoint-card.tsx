import { cn } from "cn";
import Link from "next/link";
import { formatCompactNumber, formatCredits } from "@/lib/format";
import { REFRESH_INTERVALS } from "../constants";
import { endpointHref } from "../lib/endpoint-urls";
import type { Endpoint } from "../types";
import { EndpointCover } from "./endpoint-cover";
import { LikeButton } from "./like-button";
import { PublisherAvatar } from "./publisher-avatar";
import { StatusPill } from "./status-pill";

interface EndpointCardProps {
  endpoint: Endpoint;
  /** Load the photo eagerly when the card is above the fold. */
  priority?: boolean;
  className?: string;
}

/**
 * Catalog card: photo, what the data is, its live value, and who publishes it. The title link
 * covers the whole card; the like button sits above it.
 */
export function EndpointCard({ endpoint, priority = false, className }: EndpointCardProps) {
  const { preview } = endpoint;

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl bg-card text-left ring-1 ring-border transition-shadow duration-200 hover:shadow-float",
        className,
      )}
    >
      <EndpointCover
        cover={endpoint.cover}
        priority={priority}
        className="aspect-video"
        imageClassName="transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      >
        <div className="absolute inset-x-2.5 top-2.5 flex items-center justify-between">
          <StatusPill status={endpoint.status} />
          <LikeButton endpointId={endpoint.id} baseCount={endpoint.stats.likes} tone="glass" />
        </div>
      </EndpointCover>

      <div className="flex flex-1 flex-col gap-2 px-4 pt-3.5 pb-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="truncate font-semibold text-[0.9375rem] text-ink-950">
            <Link
              href={endpointHref(endpoint)}
              className="outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
            >
              {endpoint.title}
            </Link>
          </h3>
          <span className="shrink-0 rounded-full bg-lilac-50 px-2 py-0.5 font-medium text-[0.6875rem] text-violet-700">
            {formatCredits(endpoint.priceCredits)}
          </span>
        </div>

        <div>
          <p className="flex items-baseline gap-1.5">
            <span className="font-heading text-[1.75rem] text-ink-950 tabular-nums leading-none">
              {preview.value}
            </span>
            {preview.unit ? <span className="text-ink-500 text-sm">{preview.unit}</span> : null}
          </p>
          <p className="mt-1.5 truncate text-muted-foreground text-xs">
            {preview.caption} · {REFRESH_INTERVALS[endpoint.refresh].label.toLowerCase()}
          </p>
        </div>

        <div className="mt-auto flex items-center gap-2 border-t pt-2.5 text-muted-foreground text-xs">
          <PublisherAvatar name={endpoint.publisherHandle} size="sm" className="ring-0" />
          <span className="truncate">@{endpoint.publisherHandle}</span>
          <span className="ml-auto shrink-0 tabular-nums">
            {formatCompactNumber(endpoint.stats.paidCalls30d)} calls
          </span>
        </div>
      </div>
    </article>
  );
}
