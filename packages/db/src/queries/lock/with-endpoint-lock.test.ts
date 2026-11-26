import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestDatabase, type TestDatabase } from "../../testing/create-test-database";
import { storedId } from "../stored-id";
import { withEndpointLock } from "./with-endpoint-lock";

const ENDPOINT = storedId("endpoint", "ep_weather_now");

let database: TestDatabase;

beforeEach(async () => {
  database = await createTestDatabase();
});

afterEach(async () => {
  await database.close();
});

describe("withEndpointLock", () => {
  it("runs the work and returns what it returns", async () => {
    expect(await withEndpointLock(database.db, ENDPOINT, async () => "refreshed")).toBe(
      "refreshed",
    );
  });

  it("releases the lock when the work ends", async () => {
    await withEndpointLock(database.db, ENDPOINT, async () => undefined);

    expect(
      await database.query(
        "select count(*)::int as locks from pg_locks where locktype = 'advisory'",
      ),
    ).toEqual([{ locks: 0 }]);
  });
});
