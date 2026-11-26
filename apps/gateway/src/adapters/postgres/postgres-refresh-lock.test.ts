import { createTestDatabase } from "@repo/db/testing/create-test-database";
import { createFakeWait } from "@repo/recipes/ports/testing/fake-wait";
import { describe, expect, it } from "vitest";
import { testId } from "../../testing/test-deps";
import { createPostgresRefreshLock } from "./postgres-refresh-lock";

describe("createPostgresRefreshLock", () => {
  it("runs the refresh under the endpoint's advisory lock and returns its result", async () => {
    const database = await createTestDatabase();
    const timer = createFakeWait();
    const lock = createPostgresRefreshLock(database.db, timer.wait);

    expect(await lock.withLock(testId("endpoint", "ep_weather_now"), async () => "refreshed")).toBe(
      "refreshed",
    );
    expect(timer.started).toEqual([]);
    await database.close();
  });
});
