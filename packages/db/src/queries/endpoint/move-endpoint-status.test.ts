import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { accounts } from "../../schema/accounts-table";
import { endpoints } from "../../schema/endpoints-table";
import { createTestDatabase, type TestDatabase } from "../../testing/create-test-database";
import { accountRow, endpointRow } from "../../testing/test-rows";
import { storedId } from "../stored-id";
import { moveEndpointStatus } from "./move-endpoint-status";

const ENDPOINT = storedId("endpoint", "ep_weather_now");

let database: TestDatabase;

beforeEach(async () => {
  database = await createTestDatabase();
  await database.db.insert(accounts).values(accountRow());
  await database.db.insert(endpoints).values(endpointRow());
});

afterEach(async () => {
  await database.close();
});

async function statusNow(): Promise<unknown> {
  const [row] = await database.query("select status from endpoints where id = $1", [ENDPOINT]);
  return row?.status;
}

describe("moveEndpointStatus", () => {
  it("moves an endpoint that still has the status the move starts from", async () => {
    expect(
      await moveEndpointStatus(database.db, {
        endpoint_id: ENDPOINT,
        from: "live",
        to: "degraded",
      }),
    ).toBe(true);
    expect(await statusNow()).toBe("degraded");
  });

  it("changes nothing when the endpoint no longer has that status", async () => {
    expect(
      await moveEndpointStatus(database.db, {
        endpoint_id: ENDPOINT,
        from: "degraded",
        to: "live",
      }),
    ).toBe(false);
    expect(await statusNow()).toBe("live");
  });

  it("refuses a move the transition table does not allow", async () => {
    await expect(
      moveEndpointStatus(database.db, { endpoint_id: ENDPOINT, from: "live", to: "building" }),
    ).rejects.toThrow("An endpoint cannot move from live to building.");
  });
});
