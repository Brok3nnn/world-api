import "server-only";

import { getReferenceTime } from "@/features/catalog/data/queries";
import type { ActivityEvent, ApiRequest, CommunityFeed } from "../types";
import { activityFixtures } from "./fixtures/activity";
import { apiRequestFixtures } from "./fixtures/api-requests";

/*
 * Community data access. Feeds carry their own `asOf` so relative dates render identically on
 * the server and the client without reading the clock.
 */

export async function listApiRequests(): Promise<CommunityFeed<ApiRequest>> {
  return {
    items: [...apiRequestFixtures].sort((a, b) => b.votes - a.votes),
    asOf: await getReferenceTime(),
  };
}

export async function listRecentActivity(): Promise<CommunityFeed<ActivityEvent>> {
  return {
    items: [...activityFixtures].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)),
    asOf: await getReferenceTime(),
  };
}
