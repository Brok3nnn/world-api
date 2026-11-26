import { ArrowRightIcon, HammerIcon } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { builderUrl } from "@/features/builder/search-params";
import { endpointHref } from "@/features/catalog/lib/endpoint-urls";
import { formatRelativeTime } from "@/lib/format";
import { REQUEST_STATUSES } from "../constants";
import type { ApiRequest } from "../types";
import { UpvoteButton } from "./upvote-button";

interface ApiRequestCardProps {
  request: ApiRequest;
  /** Reference time for the relative creation date. */
  asOf: string;
}

export function ApiRequestCard({ request, asOf }: ApiRequestCardProps) {
  const status = REQUEST_STATUSES[request.status];

  return (
    <li className="flex items-start gap-4 rounded-2xl border bg-card p-4 sm:items-center">
      <UpvoteButton subject={request.title} initialVotes={request.votes} />
      <div className="flex min-w-0 flex-1 flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
            <Badge variant={status.badge}>{status.label}</Badge>
            <span className="font-medium">@{request.requesterHandle}</span>
            <span aria-hidden>·</span>
            <time dateTime={request.createdAt}>{formatRelativeTime(request.createdAt, asOf)}</time>
          </div>
          <h3 className="text-pretty font-medium text-ink-950">{request.title}</h3>
        </div>
        <RequestAction request={request} />
      </div>
    </li>
  );
}

function RequestAction({ request }: { request: ApiRequest }) {
  if (request.status === "shipped" && request.endpoint) {
    return (
      <Button
        variant="outline"
        size="sm"
        nativeButton={false}
        render={<Link href={endpointHref(request.endpoint)} />}
      >
        View API
        <ArrowRightIcon aria-hidden data-icon="inline-end" />
      </Button>
    );
  }
  if (request.status === "open") {
    return (
      <Button
        variant="brand"
        size="sm"
        nativeButton={false}
        render={<Link href={builderUrl({ q: request.title })} />}
      >
        <HammerIcon aria-hidden data-icon="inline-start" />
        Build it
      </Button>
    );
  }
  return null;
}
