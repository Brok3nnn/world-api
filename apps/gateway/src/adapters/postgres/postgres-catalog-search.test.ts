import { accounts } from "@repo/db/schema/accounts-table";
import { endpoints as endpointsTable } from "@repo/db/schema/endpoints-table";
import { createTestDatabase } from "@repo/db/testing/create-test-database";
import { accountRow } from "@repo/db/testing/test-rows";
import { describeCatalogSearch } from "../../ports/testing/catalog-search-contract";
import { createPostgresCatalogSearch } from "./postgres-catalog-search";

describeCatalogSearch("The Postgres search", async (served) => {
  const database = await createTestDatabase();
  await database.db.insert(accounts).values(accountRow());
  for (const { id, definition } of served) {
    const { owner: _owner, ...fields } = definition;
    await database.db.insert(endpointsTable).values({ ...fields, id, owner_id: "acc_core" });
  }
  return { search: createPostgresCatalogSearch(database.db), close: () => database.close() };
});
