import { accounts } from "@repo/db/schema/accounts-table";
import { endpoints } from "@repo/db/schema/endpoints-table";
import { usageEvents } from "@repo/db/schema/usage-events-table";
import { createTestDatabase } from "@repo/db/testing/create-test-database";
import { accountRow, endpointRow } from "@repo/db/testing/test-rows";
import { describe, expect, it } from "vitest";
import { testId } from "../../testing/test-deps";
import { createPostgresUsageSink } from "./postgres-usage-sink";

function event(endpointId: string) {
  return {
    id: testId("usageEvent", "use_call_1"),
    endpointId: testId("endpoint", endpointId),
    callerId: null,
    outcome: "served" as const,
    shape: "json" as const,
    priceCredits: 1,
    latencyMs: 12,
    refreshed: false,
  };
}

describe("createPostgresUsageSink", () => {
  it("writes an event as a row of usage_events, without a caller for an anonymous call", async () => {
    const database = await createTestDatabase();
    await database.db.insert(accounts).values(accountRow());
    await database.db.insert(endpoints).values(endpointRow());

    expect((await createPostgresUsageSink(database.db).record(event("ep_weather_now"))).ok).toBe(
      true,
    );
    expect(
      await database.db
        .select({ outcome: usageEvents.outcome, caller: usageEvents.caller_id })
        .from(usageEvents),
    ).toEqual([{ outcome: "served", caller: null }]);
    await database.close();
  });

  it("reports a write the database refuses as unrecorded instead of throwing", async () => {
    const database = await createTestDatabase();

    expect(await createPostgresUsageSink(database.db).record(event("ep_missing"))).toEqual({
      ok: false,
      error: { code: "unrecorded" },
    });
    await database.close();
  });
});
