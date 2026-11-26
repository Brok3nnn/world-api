import type { AccountId, EndpointId, UsageEventId } from "@repo/core/ids/id";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { accounts } from "../../schema/accounts-table";
import { endpoints } from "../../schema/endpoints-table";
import { usageEvents } from "../../schema/usage-events-table";
import { createTestDatabase, type TestDatabase } from "../../testing/create-test-database";
import { accountRow, endpointRow } from "../../testing/test-rows";
import { appendUsageEvent } from "./append-usage-event";

// Safe: the literals have the prefix and shape of their kinds.
const EVENT = {
  id: "use_1" as UsageEventId,
  endpoint_id: "ep_weather_now" as EndpointId,
  outcome: "served",
  shape: "number",
  price_credits: 1,
  latency_ms: 14,
  refreshed: true,
} as const;

let database: TestDatabase;

beforeEach(async () => {
  database = await createTestDatabase();
  await database.db.insert(accounts).values(accountRow());
  await database.db.insert(endpoints).values(endpointRow());
});

afterEach(async () => {
  await database.close();
});

describe("appendUsageEvent", () => {
  it("records an anonymous call and a refused call by an account", async () => {
    await appendUsageEvent(database.db, EVENT);
    await appendUsageEvent(database.db, {
      ...EVENT,
      id: "use_2" as UsageEventId,
      caller_id: "acc_core" as AccountId,
      outcome: "payment_required",
      price_credits: 0,
    });

    expect(await database.db.select().from(usageEvents)).toMatchObject([
      { id: "use_1", caller_id: null, outcome: "served" },
      { id: "use_2", caller_id: "acc_core", outcome: "payment_required" },
    ]);
  });
});
