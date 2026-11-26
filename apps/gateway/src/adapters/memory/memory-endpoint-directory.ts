import type { EndpointDirectory, ServedEndpoint } from "../../ports/endpoint-directory";

/** An `EndpointDirectory` over a fixed list, for tests and local runs without a database. */
export function createMemoryEndpointDirectory(
  endpoints: readonly ServedEndpoint[],
): EndpointDirectory {
  return {
    find: async ({ owner, slug }) =>
      endpoints.find(({ definition }) => definition.owner === owner && definition.slug === slug) ??
      null,
  };
}
