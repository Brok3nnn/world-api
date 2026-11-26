import type { Database } from "../client/database";
import { upsertSource } from "../queries/source/upsert-source";
import { storedId } from "../queries/stored-id";
import { accounts } from "../schema/accounts-table";
import { endpointSources } from "../schema/endpoint-sources-table";
import { endpoints } from "../schema/endpoints-table";
import { recipeVersions } from "../schema/recipe-versions-table";
import { CATALOG_ENDPOINTS } from "./catalog/catalog-endpoints";
import { CORE_ACCOUNT } from "./core-account";
import { SOURCE_REGISTRY } from "./source-registry";

/** Writes each catalog endpoint, live with its first recipe version active and its sources linked. */
async function seedCatalog(db: Database): Promise<void> {
  for (const { id, definition, recipe, sources } of CATALOG_ENDPOINTS) {
    const { owner: _owner, ...fields } = definition;
    await db
      .insert(endpoints)
      .values({ ...fields, id, owner_id: CORE_ACCOUNT.id })
      .onConflictDoNothing({ target: endpoints.id });
    await db
      .insert(recipeVersions)
      .values({
        id: `rv_${id.slice("ep_".length)}_1`,
        endpoint_id: id,
        version: 1,
        document: recipe,
        active: true,
      })
      .onConflictDoNothing({ target: recipeVersions.id });
    await db
      .insert(endpointSources)
      .values(sources.map((source) => ({ endpoint_id: id, source_id: source })))
      .onConflictDoNothing();
  }
}

/**
 * Writes the platform account, the approved sources and the catalog endpoints. Running it again
 * changes nothing that is already there: the account and endpoints are kept by id, and each
 * source is matched by its name.
 */
export async function seedDatabase(
  db: Database,
): Promise<{ readonly sources: number; readonly endpoints: number }> {
  await db.insert(accounts).values(CORE_ACCOUNT).onConflictDoNothing({ target: accounts.id });
  for (const source of SOURCE_REGISTRY) {
    const stored = await upsertSource(db, {
      id: storedId("source", source.id),
      definition: source.definition,
    });
    if (!stored.ok) {
      throw new Error(
        `Seed source ${source.id} breaks its contract: ${stored.error.issues.join(" ")}`,
      );
    }
  }
  await seedCatalog(db);
  return { sources: SOURCE_REGISTRY.length, endpoints: CATALOG_ENDPOINTS.length };
}
