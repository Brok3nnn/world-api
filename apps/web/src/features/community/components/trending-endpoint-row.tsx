import { cn } from "cn";
import { TrendingUpIcon } from "lucide-react";
import Link from "next/link";
import { EndpointCover } from "@/features/catalog/components/endpoint-cover";
import { LikeButton } from "@/features/catalog/components/like-button";
import { endpointHref } from "@/features/catalog/lib/endpoint-urls";
import type { Endpoint } from "@/features/catalog/types";
import { formatCompactNumber, formatSignedPercent } from "@/lib/format";

interface TrendingEndpointRowProps {
  endpoint: Endpoint;
  rank: number;
}

const PODIUM_SIZE = 3;

/** One ranked row: position, photo, API, call growth versus the previous 30 days, likes. */
export function TrendingEndpointRow({ endpoint, rank }: TrendingEndpointRowProps) {
  return (
    <li className="relative flex items-center gap-3 rounded-2xl bg-card p-2.5 pr-3 ring-1 ring-border transition-shadow hover:shadow-float sm:gap-4">
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full font-semibold text-xs tabular-nums",
          rank <= PODIUM_SIZE ? "bg-lilac-50 text-violet-700" : "text-muted-foreground",
        )}
      >
        <span className="sr-only">Rank </span>
        {rank}
      </span>
      <EndpointCover cover={endpoint.cover} sizes="48px" className="size-12 shrink-0 rounded-xl" />
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="truncate font-semibold text-ink-950">
          <Link
            href={endpointHref(endpoint)}
            className="outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
          >
            {endpoint.title}
          </Link>
        </h3>
        <p className="truncate text-muted-foreground text-xs">
          @{endpoint.publisherHandle} · {formatCompactNumber(endpoint.stats.paidCalls30d)} calls
        </p>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-mint-600 text-sm tabular-nums">
        <TrendingUpIcon aria-hidden className="size-4" />
        <span className="sr-only">Paid calls change: </span>
        {formatSignedPercent(endpoint.stats.callsTrend)}
      </span>
      <LikeButton endpointId={endpoint.id} baseCount={endpoint.stats.likes} />
    </li>
  );
}
