import "server-only";

import type { Viewer } from "../types";

/**
 * The viewer is also a catalog publisher, so their dashboard links to sample catalog endpoints.
 * The credit balance is sample data.
 */
const viewerFixture: Viewer = {
  handle: "rooftop_lab",
  displayName: "Rooftop Lab",
  creditsRemaining: 840,
  monthlyFreeCredits: 1000,
};

/** The signed-in account. Fixture until authentication exists. */
export async function getViewer(): Promise<Viewer> {
  return viewerFixture;
}
