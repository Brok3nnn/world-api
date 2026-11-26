import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { accounts } from "../../schema/accounts-table";
import { endpoints } from "../../schema/endpoints-table";
import { createTestDatabase, type TestDatabase } from "../../testing/create-test-database";
import { accountRow, endpointRow } from "../../testing/test-rows";
import { CATALOG_PAGE_MAX, listCatalogEndpoints } from "./list-catalog-endpoints";

let database: TestDatabase;

beforeEach(async () => {
  database = await createTestDatabase();
  await database.db.insert(accounts).values(accountRow());
});

afterEach(async () => {
  await database.close();
});

/** Inserts public endpoints `ep_0`… whose creation times differ by a microsecond. */
async function insertEndpoints(count: number): Promise<void> {
  await database.db
    .insert(endpoints)
    .values(
      Array.from({ length: count }, (_, index) =>
        endpointRow({ id: `ep_${index}`, slug: `api-${index}` }),
      ),
    );
  await database.query(
    "update endpoints set created_at = '2026-11-21 12:00:00+00'::timestamptz + (substr(id, 4)::int * interval '1 microsecond')",
  );
}

/** Every id the catalog lists, following cursors from the first page to the last. */
async function readAllPages(limit: number): Promise<string[]> {
  const ids: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await listCatalogEndpoints(database.db, { limit, ...(cursor ? { cursor } : {}) });
    if (!page.ok) {
      throw new Error("unexpected invalid cursor");
    }
    ids.push(...page.value.items.map((item) => item.id));
    cursor = page.value.nextCursor ?? undefined;
  } while (cursor !== undefined);
  return ids;
}

describe("listCatalogEndpoints", () => {
  it("pages through every endpoint exactly once, newest first", async () => {
    await insertEndpoints(5);

    expect(await readAllPages(2)).toEqual(["ep_4", "ep_3", "ep_2", "ep_1", "ep_0"]);
  });

  it("shows what a catalog page needs", async () => {
    await insertEndpoints(1);

    const page = await listCatalogEndpoints(database.db, { limit: 10 });

    expect(page).toEqual({
      ok: true,
      value: {
        items: [
          expect.objectContaining({ id: "ep_0", owner: "core", slug: "api-0", price_credits: 1 }),
        ],
        nextCursor: null,
      },
    });
  });

  it("lists only public endpoints that answer calls", async () => {
    await database.db
      .insert(endpoints)
      .values([
        endpointRow({ id: "ep_public" }),
        endpointRow({ id: "ep_degraded", slug: "b", status: "degraded" }),
        endpointRow({ id: "ep_private", slug: "c", visibility: "private" }),
        endpointRow({ id: "ep_unlisted", slug: "d", visibility: "unlisted" }),
        endpointRow({ id: "ep_disabled", slug: "e", status: "disabled" }),
        endpointRow({ id: "ep_building", slug: "f", status: "building" }),
      ]);

    expect((await readAllPages(10)).sort()).toEqual(["ep_degraded", "ep_public"]);
  });

  it("never returns more than the maximum page size", async () => {
    await insertEndpoints(CATALOG_PAGE_MAX + 1);

    const page = await listCatalogEndpoints(database.db, { limit: 1000 });

    expect(page.ok && page.value.items).toHaveLength(CATALOG_PAGE_MAX);
  });

  it("returns at least one endpoint for a page size below one", async () => {
    await insertEndpoints(2);

    const page = await listCatalogEndpoints(database.db, { limit: 0 });

    expect(page.ok && page.value.items).toHaveLength(1);
  });

  it.each([
    "not-a-cursor",
    Buffer.from('{"created_at":"yesterday","id":"ep_1"}').toString("base64url"),
  ])("refuses the cursor %j", async (cursor) => {
    expect(await listCatalogEndpoints(database.db, { limit: 2, cursor })).toEqual({
      ok: false,
      error: { code: "invalid_cursor" },
    });
  });
});
