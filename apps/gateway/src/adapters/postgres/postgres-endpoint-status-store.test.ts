import { accounts } from "@repo/db/schema/accounts-table";
import { endpoints } from "@repo/db/schema/endpoints-table";
import { createTestDatabase } from "@repo/db/testing/create-test-database";
import { accountRow, endpointRow } from "@repo/db/testing/test-rows";
import { describeEndpointStatusStore } from "../../ports/testing/endpoint-status-store-contract";
import { createPostgresEndpointStatusStore } from "./postgres-endpoint-status-store";

describeEndpointStatusStore("The Postgres status store", async () => {
  const database = await createTestDatabase();
  await database.db.insert(accounts).values(accountRow());
  await database.db.insert(endpoints).values(endpointRow());
  return { store: createPostgresEndpointStatusStore(database.db), close: () => database.close() };
});
