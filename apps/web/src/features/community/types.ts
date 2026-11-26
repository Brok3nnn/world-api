import type { Endpoint, Publisher } from "@/features/catalog/types";

export type ApiRequestStatus = "open" | "building" | "shipped";

type EndpointRef = Pick<Endpoint, "publisherHandle" | "slug">;

/** A data API someone asked for that does not exist in the catalog yet. */
export interface ApiRequest {
  id: string;
  title: string;
  requesterHandle: string;
  createdAt: string;
  votes: number;
  status: ApiRequestStatus;
  /** Set once the request has shipped as a catalog endpoint. */
  endpoint?: EndpointRef;
}

export type ActivityKind = "published" | "liked" | "request-shipped" | "milestone";

export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  actorHandle: string;
  /** Short sentence fragment that follows the actor, e.g. "published Hive weight". */
  description: string;
  occurredAt: string;
  endpoint?: EndpointRef;
}

/** A dated list returned by community queries. `asOf` is the reference time for relative dates. */
export interface CommunityFeed<Item> {
  items: readonly Item[];
  asOf: string;
}

export interface PublisherRanking {
  rank: number;
  publisher: Publisher;
  endpointCount: number;
  paidCalls30d: number;
  /** Mean uptime across the publisher's endpoints, 0..1. */
  averageUptime: number;
  totalLikes: number;
}
