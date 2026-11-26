import { SOURCE_EXAMPLE } from "@repo/contracts/source/examples/source-example";
import type { SourceId } from "@repo/core/ids/id";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { sources } from "../../schema/sources-table";
import { createTestDatabase, type TestDatabase } from "../../testing/create-test-database";
import { upsertSource } from "./upsert-source";

// Safe: the literals have the prefix and shape of a source id.
const FIRST = "src_weather" as SourceId;
const SECOND = "src_weather_again" as SourceId;

let database: TestDatabase;

beforeEach(async () => {
  database = await createTestDatabase();
});

afterEach(async () => {
  await database.close();
});

describe("upsertSource", () => {
  it("records a new source and returns its id", async () => {
    const result = await upsertSource(database.db, { id: FIRST, definition: SOURCE_EXAMPLE });

    expect(result).toEqual({ ok: true, value: FIRST });
    expect(await database.db.select().from(sources)).toHaveLength(1);
  });

  it("updates the source with the same name and keeps its id", async () => {
    await upsertSource(database.db, { id: FIRST, definition: SOURCE_EXAMPLE });

    const result = await upsertSource(database.db, {
      id: SECOND,
      definition: { ...SOURCE_EXAMPLE, tier: "yellow", rate_limit_per_min: 30 },
    });

    expect(result).toEqual({ ok: true, value: FIRST });
    expect(await database.db.select().from(sources)).toMatchObject([
      { id: FIRST, tier: "yellow", rate_limit_per_min: 30 },
    ]);
  });

  it("refuses a source that breaks its contract, before it reaches the database", async () => {
    const definition = { ...SOURCE_EXAMPLE, hosts: ["other.example.org"] };

    const result = await upsertSource(database.db, { id: FIRST, definition });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "invalid_source",
        issues: ["The sample is on api.example.org, which is not one of the source's hosts."],
      },
    });
    expect(await database.db.select().from(sources)).toEqual([]);
  });
});
