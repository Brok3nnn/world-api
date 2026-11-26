import { accounts } from "@repo/db/schema/accounts-table";
import { endpointSources } from "@repo/db/schema/endpoint-sources-table";
import { endpoints as endpointsTable } from "@repo/db/schema/endpoints-table";
import { recipeVersions } from "@repo/db/schema/recipe-versions-table";
import { sources } from "@repo/db/schema/sources-table";
import { createTestDatabase } from "@repo/db/testing/create-test-database";
import { accountRow, sourceRow } from "@repo/db/testing/test-rows";
import { describeEndpointDirectory } from "../../ports/testing/endpoint-directory-contract";
import { createPostgresEndpointDirectory } from "./postgres-endpoint-directory";

describeEndpointDirectory("The Postgres directory", async (served) => {
  const database = await createTestDatabase();
  const { db } = database;
  await db.insert(accounts).values(accountRow());
  for (const { id, definition, recipe, sources: used } of served) {
    const { owner: _owner, ...fields } = definition;
    await db.insert(endpointsTable).values({ ...fields, id, owner_id: "acc_core" });
    if (recipe !== null) {
      await db.insert(recipeVersions).values({
        id: recipe.id,
        endpoint_id: id,
        version: 1,
        document: recipe.document,
        active: true,
      });
    }
    for (const source of used) {
      await db
        .insert(sources)
        .values(
          sourceRow({
            id: source.id,
            name: source.name,
            hosts: [...source.hosts],
            docs_url: source.url,
            licence: source.licence,
            attribution: source.attribution,
            tier: source.tier,
            policy_checked_at: source.policyCheckedAt,
            rate_limit_per_min: source.rateLimitPerMin,
          }),
        )
        .onConflictDoNothing();
      await db.insert(endpointSources).values({ endpoint_id: id, source_id: source.id });
    }
  }
  return { directory: createPostgresEndpointDirectory(db), close: () => database.close() };
});
