import "server-only";

import type { Endpoint, EndpointSummary, Publisher } from "../types";
import { endpointFixtures, FIXTURE_REFERENCE_TIME } from "./fixtures/endpoints";
import { publisherFixtures } from "./fixtures/publishers";

/*
 * Catalog data access. Every read goes through these functions so the fixture source can be
 * swapped for the real database without touching any component.
 */

export async function listEndpoints(): Promise<readonly Endpoint[]> {
  return endpointFixtures;
}

export async function listEndpointSummaries(): Promise<EndpointSummary[]> {
  return endpointFixtures.map(
    ({ id, title, summary, publisherHandle, slug, category, tags, cover, preview }) => ({
      id,
      title,
      summary,
      publisherHandle,
      slug,
      category,
      tags,
      cover,
      preview,
    }),
  );
}

export async function getEndpoint(
  publisherHandle: string,
  slug: string,
): Promise<Endpoint | undefined> {
  return endpointFixtures.find(
    (endpoint) => endpoint.publisherHandle === publisherHandle && endpoint.slug === slug,
  );
}

export async function listPublishers(): Promise<readonly Publisher[]> {
  return publisherFixtures;
}

export async function getPublisher(handle: string): Promise<Publisher | undefined> {
  return publisherFixtures.find((publisher) => publisher.handle === handle);
}

export interface CatalogStats {
  endpointCount: number;
  publisherCount: number;
  paidCalls30d: number;
}

export async function getCatalogStats(): Promise<CatalogStats> {
  return {
    endpointCount: endpointFixtures.length,
    publisherCount: publisherFixtures.length,
    paidCalls30d: endpointFixtures.reduce((sum, endpoint) => sum + endpoint.stats.paidCalls30d, 0),
  };
}

/**
 * The "now" that relative times are rendered against. Fixed while data comes from fixtures so
 * prerendered and hydrated output match; becomes request time once data is live.
 */
export async function getReferenceTime(): Promise<string> {
  return FIXTURE_REFERENCE_TIME;
}
