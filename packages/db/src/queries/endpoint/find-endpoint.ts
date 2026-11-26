import {
  type EndpointDefinition,
  endpointDefinitionSchema,
} from "@repo/contracts/endpoint/endpoint-definition";
import { idSchema } from "@repo/contracts/ids";
import { type Recipe, recipeSchema } from "@repo/contracts/recipe/recipe-schema";
import { sourceTierSchema } from "@repo/contracts/source/source-tier";
import type { AccountId, EndpointId, RecipeVersionId, SourceId } from "@repo/core/ids/id";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "../../client/database";
import { accounts } from "../../schema/accounts-table";
import { endpointSources } from "../../schema/endpoint-sources-table";
import { endpoints } from "../../schema/endpoints-table";
import { recipeVersions } from "../../schema/recipe-versions-table";
import { sources } from "../../schema/sources-table";
import { parseStored } from "../parse-stored";
import { storedId } from "../stored-id";

const endpointSourcesSchema = z.array(
  z.strictObject({
    id: idSchema("source"),
    name: z.string(),
    hosts: z.array(z.string()),
    docs_url: z.string(),
    licence: z.string(),
    attribution: z.string().nullable(),
    tier: sourceTierSchema,
    /** When the source's terms were last checked, as Postgres writes a timestamp into JSON. */
    policy_checked_at: z.iso.datetime({ offset: true }),
    rate_limit_per_min: z.int(),
  }),
);

/** A source an endpoint uses, with what serving a call needs to know about it. */
export type EndpointSource = Omit<z.infer<typeof endpointSourcesSchema>[number], "id"> & {
  readonly id: SourceId;
};

/** Everything needed to serve a call of one endpoint. */
export interface ResolvedEndpoint {
  readonly id: EndpointId;
  readonly owner_id: AccountId;
  readonly definition: EndpointDefinition;
  /** The active recipe version, or `null` while the endpoint has none. */
  readonly recipe: {
    readonly id: RecipeVersionId;
    readonly version: number;
    readonly document: Recipe;
  } | null;
  /** Sorted by name. */
  readonly sources: readonly EndpointSource[];
}

const sourceList = sql<unknown>`coalesce((
  select json_agg(json_build_object(
    'id', ${sources.id}, 'name', ${sources.name}, 'hosts', ${sources.hosts},
    'docs_url', ${sources.docs_url}, 'licence', ${sources.licence},
    'attribution', ${sources.attribution}, 'tier', ${sources.tier},
    'policy_checked_at', ${sources.policy_checked_at},
    'rate_limit_per_min', ${sources.rate_limit_per_min}
  ) order by ${sources.name})
  from ${endpointSources} join ${sources} on ${sources.id} = ${endpointSources.source_id}
  where ${endpointSources.endpoint_id} = ${endpoints.id}
), '[]'::json)`;

/** Finds the endpoint at `@owner/slug` with its active recipe and sources, in one round trip. */
export async function findEndpoint(
  db: Database,
  path: { readonly owner: string; readonly slug: string },
): Promise<ResolvedEndpoint | undefined> {
  const [row] = await db
    .select({
      endpoint: endpoints,
      handle: accounts.handle,
      recipe: recipeVersions,
      sources: sourceList,
    })
    .from(endpoints)
    .innerJoin(accounts, eq(accounts.id, endpoints.owner_id))
    .leftJoin(
      recipeVersions,
      and(eq(recipeVersions.endpoint_id, endpoints.id), eq(recipeVersions.active, true)),
    )
    .where(and(eq(accounts.handle, path.owner), eq(endpoints.slug, path.slug)));
  if (row === undefined) {
    return undefined;
  }
  const { id, owner_id, created_at: _created, updated_at: _updated, ...fields } = row.endpoint;
  return {
    id: storedId("endpoint", id),
    owner_id: storedId("account", owner_id),
    definition: parseStored(endpointDefinitionSchema, { ...fields, owner: row.handle }, "endpoint"),
    recipe:
      row.recipe === null
        ? null
        : {
            id: storedId("recipeVersion", row.recipe.id),
            version: row.recipe.version,
            document: parseStored(recipeSchema, row.recipe.document, "recipe"),
          },
    sources: parseStored(endpointSourcesSchema, row.sources, "endpoint sources").map((source) => ({
      ...source,
      id: storedId("source", source.id),
    })),
  };
}
