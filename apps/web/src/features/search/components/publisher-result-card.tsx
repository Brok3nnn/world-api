import Link from "next/link";
import { PublisherAvatar } from "@/features/catalog/components/publisher-avatar";
import { PublisherBadges } from "@/features/catalog/components/publisher-badges";
import { publisherHref } from "@/features/catalog/lib/endpoint-urls";
import type { Publisher } from "@/features/catalog/types";
import { formatNumber } from "@/lib/format";

interface PublisherResultCardProps {
  publisher: Publisher;
  endpointCount: number;
}

export function PublisherResultCard({ publisher, endpointCount }: PublisherResultCardProps) {
  return (
    <article className="relative flex h-full flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-border transition-shadow hover:shadow-float">
      <div className="flex items-center gap-3">
        <PublisherAvatar name={publisher.displayName} seed={publisher.handle} size="lg" />
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-ink-950">
            <Link
              href={publisherHref(publisher.handle)}
              className="outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
            >
              {publisher.displayName}
            </Link>
          </h3>
          <p className="truncate text-muted-foreground text-xs">@{publisher.handle}</p>
        </div>
      </div>
      <PublisherBadges publisher={publisher} />
      <p className="line-clamp-2 text-muted-foreground text-sm">{publisher.bio}</p>
      <p className="mt-auto text-muted-foreground text-xs tabular-nums">
        {formatNumber(endpointCount)} {endpointCount === 1 ? "API" : "APIs"}
      </p>
    </article>
  );
}
