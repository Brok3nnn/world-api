import Link from "next/link";
import { PublisherAvatar } from "@/features/catalog/components/publisher-avatar";
import { endpointHref } from "@/features/catalog/lib/endpoint-urls";
import { formatRelativeTime } from "@/lib/format";
import { ACTIVITY_ICONS } from "../constants";
import type { ActivityEvent, CommunityFeed } from "../types";

interface ActivityFeedProps {
  feed: CommunityFeed<ActivityEvent>;
}

export function ActivityFeed({ feed }: ActivityFeedProps) {
  return (
    <section
      aria-labelledby="recent-activity-title"
      className="flex flex-col rounded-2xl bg-card p-5 ring-1 ring-border"
    >
      <h2 id="recent-activity-title" className="font-heading text-ink-950 text-lg">
        Recent activity
      </h2>
      <ol className="mt-2 flex flex-col">
        {feed.items.map((event) => {
          const Icon = ACTIVITY_ICONS[event.kind];
          return (
            <li key={event.id} className="flex gap-3 border-b py-3.5 last:border-b-0 last:pb-0">
              <span className="relative size-9 shrink-0">
                <PublisherAvatar name={event.actorHandle} className="ring-0" />
                <span className="absolute -right-1 -bottom-1 flex size-4.5 items-center justify-center rounded-full bg-background text-violet-700 ring-1 ring-border">
                  <Icon aria-hidden className="size-2.5" />
                </span>
              </span>
              <div className="flex min-w-0 flex-col gap-0.5 text-sm">
                <p className="text-pretty text-ink-800">
                  <span className="font-semibold text-ink-950">@{event.actorHandle}</span>{" "}
                  {event.endpoint ? (
                    <Link
                      href={endpointHref(event.endpoint)}
                      className="rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {event.description}
                    </Link>
                  ) : (
                    event.description
                  )}
                </p>
                <time dateTime={event.occurredAt} className="text-muted-foreground text-xs">
                  {formatRelativeTime(event.occurredAt, feed.asOf)}
                </time>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
