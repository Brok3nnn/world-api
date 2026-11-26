import { BadgeCheckIcon } from "lucide-react";
import Link from "next/link";
import { EndpointCover } from "@/features/catalog/components/endpoint-cover";
import { EndpointValue } from "@/features/catalog/components/endpoint-value";
import { LikeButton } from "@/features/catalog/components/like-button";
import { PublisherAvatar } from "@/features/catalog/components/publisher-avatar";
import { StatusPill } from "@/features/catalog/components/status-pill";
import { publisherHref } from "@/features/catalog/lib/endpoint-urls";
import type { Endpoint, Publisher } from "@/features/catalog/types";

interface EndpointHeroProps {
  endpoint: Endpoint;
  publisher: Publisher | undefined;
}

/** Top of an endpoint page: cover artwork, then title, owner and the live value. */
export function EndpointHero({ endpoint, publisher }: EndpointHeroProps) {
  const publisherName = publisher?.displayName ?? `@${endpoint.publisherHandle}`;

  return (
    <div className="flex flex-col gap-6">
      <EndpointCover cover={endpoint.cover} priority className="aspect-5/2 rounded-3xl">
        <div className="absolute inset-x-4 top-4 flex items-center justify-between">
          <StatusPill status={endpoint.status} />
          <LikeButton endpointId={endpoint.id} baseCount={endpoint.stats.likes} tone="glass" />
        </div>
      </EndpointCover>

      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <header className="flex min-w-0 flex-col gap-2">
          <h1 className="font-heading text-4xl text-ink-950 md:text-5xl">{endpoint.title}</h1>
          <Link
            href={publisherHref(endpoint.publisherHandle)}
            className="inline-flex w-fit items-center gap-2 rounded-full text-muted-foreground outline-none transition-colors hover:text-ink-950 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <PublisherAvatar name={publisherName} seed={endpoint.publisherHandle} size="sm" />
            {publisherName}
            {publisher?.verified ? (
              <BadgeCheckIcon aria-label="Verified" className="size-4 text-violet-600" />
            ) : null}
          </Link>
        </header>
        <EndpointValue
          preview={endpoint.preview}
          size="lg"
          className="sm:items-end sm:text-right"
        />
      </div>
    </div>
  );
}
