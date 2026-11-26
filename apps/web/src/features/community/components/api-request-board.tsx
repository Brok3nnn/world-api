import type { ApiRequest, CommunityFeed } from "../types";
import { ApiRequestCard } from "./api-request-card";

interface ApiRequestBoardProps {
  feed: CommunityFeed<ApiRequest>;
}

/** Requested APIs, most wanted first. */
export function ApiRequestBoard({ feed }: ApiRequestBoardProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">
        Upvote the data you need, or build it yourself. Whoever starts the build owns the endpoint.
      </p>
      <ul className="flex flex-col gap-2">
        {feed.items.map((request) => (
          <ApiRequestCard key={request.id} request={request} asOf={feed.asOf} />
        ))}
      </ul>
    </div>
  );
}
