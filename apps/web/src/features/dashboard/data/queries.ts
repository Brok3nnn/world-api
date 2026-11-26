import "server-only";

import { getViewer } from "@/features/account/data/queries";
import { getEndpoint } from "@/features/catalog/data/queries";
import { summarizeOwnedEndpoints } from "../lib/summarize-owned-endpoints";
import type { DashboardOverview } from "../types";
import { buildInProgressFixtures, ownedEndpointFixtures } from "./fixtures/dashboard";

/** Everything the viewer's dashboard shows. */
export async function getDashboardOverview(): Promise<DashboardOverview> {
  const viewer = await getViewer();
  const endpoints = await Promise.all(
    ownedEndpointFixtures.map(async (endpoint) => ({
      ...endpoint,
      listedInCatalog: (await getEndpoint(viewer.handle, endpoint.slug)) !== undefined,
    })),
  );

  return {
    endpoints,
    builds: [...buildInProgressFixtures],
    summary: summarizeOwnedEndpoints(endpoints),
  };
}
