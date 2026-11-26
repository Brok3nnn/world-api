import { SOURCE_EXAMPLE } from "@repo/contracts/source/examples/source-example";
import type { SourceId } from "@repo/core/ids/id";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { sources } from "../../schema/sources-table";
import { createTestDatabase, type TestDatabase } from "../../testing/create-test-database";
import { sourceRow } from "../../testing/test-rows";
import { getSources } from "./get-sources";

// Safe: the literals have the prefix and shape of a source id.
const id = (value: string) => value as SourceId;

let database: TestDatabase;

beforeEach(async () => {
  database = await createTestDatabase();
  await database.db
    .insert(sources)
    .values([
      sourceRow({ id: "src_b", name: "B source" }),
      sourceRow({ id: "src_a", name: "A source" }),
    ]);
});

afterEach(async () => {
  await database.close();
});

describe("getSources", () => {
  it("returns the requested sources sorted by name, as their contract", async () => {
    const found = await getSources(database.db, [id("src_b"), id("src_a")]);

    expect(found.map((source) => source.id)).toEqual(["src_a", "src_b"]);
    expect(found[0]?.definition).toEqual({
      ...SOURCE_EXAMPLE,
      name: "A source",
      policy_checked_at: "2026-11-21T10:00:00.000Z",
    });
  });

  it("leaves out ids that do not exist", async () => {
    expect(await getSources(database.db, [id("src_a"), id("src_none")])).toHaveLength(1);
  });

  it("returns nothing for no ids", async () => {
    expect(await getSources(database.db, [])).toEqual([]);
  });
});
