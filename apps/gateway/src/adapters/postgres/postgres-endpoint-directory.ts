import type { Database } from "@repo/db/client/database";
import { findEndpoint } from "@repo/db/queries/endpoint/find-endpoint";
import type { EndpointDirectory } from "../../ports/endpoint-directory";

/** The `EndpointDirectory` over the system of record: one query per lookup. */
export function createPostgresEndpointDirectory(db: Database): EndpointDirectory {
  return {
    async find(path) {
      const found = await findEndpoint(db, path);
      if (found === undefined) {
        return null;
      }
      return {
        id: found.id,
        definition: found.definition,
        recipe:
          found.recipe === null ? null : { id: found.recipe.id, document: found.recipe.document },
        sources: found.sources.map((source) => ({
          id: source.id,
          name: source.name,
          hosts: source.hosts,
          url: source.docs_url,
          licence: source.licence,
          attribution: source.attribution,
          tier: source.tier,
          policyCheckedAt: new Date(source.policy_checked_at),
          rateLimitPerMin: source.rate_limit_per_min,
        })),
      };
    },
  };
}
