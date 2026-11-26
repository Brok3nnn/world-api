import { envelopeSchema } from "@repo/contracts/api/envelope";
import { errorBodySchema } from "@repo/contracts/api/error";
import { searchPageSchema } from "@repo/contracts/search/search-page";
import type { RandomSource } from "@repo/core/ids/random-source";
import { createRecordingLogger } from "@repo/core/log/testing/recording-logger";
import { createFakeClock } from "@repo/core/time/testing/fake-clock";
import { CATALOG_ENDPOINTS } from "@repo/db/seed/catalog/catalog-endpoints";
import { createTestDatabase, type TestDatabase } from "@repo/db/testing/create-test-database";
import { createFakeHttpClient } from "@repo/recipes/ports/testing/fake-http-client";
import { createFakeResolveHost } from "@repo/recipes/ports/testing/fake-resolve-host";
import { createFakeWait } from "@repo/recipes/ports/testing/fake-wait";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CATALOG_RECORDINGS } from "../catalog/testing/catalog-recordings";
import { LOG_EVENTS } from "../log-events";
import { createLocalGateway } from "./local-gateway";

/** When the recordings were made; the sources' terms were checked four days before. */
const RECORDED_AT = new Date("2026-11-22T21:07:00.000Z");

/** Every catalog host resolves to one public address; the recordings answer every request. */
const HOSTS = [...new Set(CATALOG_RECORDINGS.map((recording) => new URL(recording.url).hostname))];

/**
 * Predictable bytes that differ on every call, so ids made at one fake instant never collide in
 * the database: each call writes its count in base 32, the size of the id alphabet.
 */
function countingRandomSource(): RandomSource {
  let count = 0;
  return {
    bytes(length) {
      count += 1;
      return Uint8Array.from({ length }, (_, index) => Math.floor(count / 32 ** index) % 32);
    },
  };
}

let database: TestDatabase;

beforeEach(async () => {
  database = await createTestDatabase();
});

afterEach(async () => {
  await database.close();
});

/** The local gateway over the test database, with the network replaced by the recordings. */
async function localGateway(now: Date = RECORDED_AT) {
  const client = createFakeHttpClient(
    Object.fromEntries(
      CATALOG_RECORDINGS.map(({ url, status, contentType, body }) => [
        url,
        { status, contentType: contentType ?? undefined, body },
      ]),
    ),
  );
  const logger = createRecordingLogger();
  const gateway = await createLocalGateway({
    db: database.db,
    clock: createFakeClock(now),
    random: countingRandomSource(),
    logger,
    egress: {
      http: client.http,
      resolveHost: createFakeResolveHost(
        Object.fromEntries(HOSTS.map((host) => [host, ["93.184.216.34"]])),
      ),
      wait: createFakeWait().wait,
      userAgent: "recipe-engine/1 (+test@example.com)",
    },
  });
  const call = (path: string) => gateway(new Request(`https://api.example.com${path}`));
  return { call, client, logger };
}

describe("createLocalGateway", () => {
  it.each(
    CATALOG_ENDPOINTS.map(({ definition }) => `/@${definition.owner}/${definition.slug}`),
  )("serves %s from the seeded database, refreshed from its sources", async (path) => {
    const { call } = await localGateway();

    const response = await call(path);

    expect(response.status).toBe(200);
    expect(envelopeSchema.safeParse(await response.json()).success).toBe(true);
  });

  it("credits each source with its name, URL, licence and required attribution only", async () => {
    const { call } = await localGateway();

    const envelope = envelopeSchema.parse(await (await call("/@core/weather-difference")).json());

    expect(envelope.sources).toEqual([
      {
        name: "Deutscher Wetterdienst Open Data Server",
        url: "https://www.dwd.de/EN/ourservices/opendata/opendata.html",
        licence: "CC BY 4.0",
        attribution: "Based on data from Deutscher Wetterdienst, values extracted and processed",
      },
      {
        name: "National Weather Service API",
        url: "https://www.weather.gov/documentation/services-web-api",
        licence: "Public domain (U.S. Government work)",
        attribution: null,
      },
    ]);
  });

  it("keeps a refreshed value in the database, so the next call fetches nothing", async () => {
    const { call, client } = await localGateway();
    await call("/@core/topeka-weather");
    const fetched = client.requests.length;

    const response = await call("/@core/topeka-weather?shape=number");

    expect(await response.text()).toBe("9");
    expect(client.requests).toHaveLength(fetched);
  });

  it("finds the seeded catalog with search", async () => {
    const { call } = await localGateway();

    const page = searchPageSchema.parse(await (await call("/search?q=weather")).json());

    expect(page.items.map((item) => item.slug)).toEqual(
      expect.arrayContaining(["topeka-weather", "frankfurt-weather", "weather-difference"]),
    );
  });

  it("warns at start about sources checked over 90 days ago, and fetches nothing from them", async () => {
    const { call, client, logger } = await localGateway(new Date("2027-03-01T00:00:00.000Z"));

    const response = await call("/@core/treasury-interest-rates");

    expect(logger.entries.filter((entry) => entry.event === LOG_EVENTS.sourceUnusable)).toEqual(
      expect.arrayContaining([
        {
          level: "warn",
          event: LOG_EVENTS.sourceUnusable,
          fields: {
            source: "U.S. Treasury Fiscal Data API",
            tier: "green",
            policy_checked_at: "2026-11-22T00:00:00.000Z",
          },
        },
      ]),
    );
    expect(response.status).toBe(503);
    expect(errorBodySchema.parse(await response.json()).error.code).toBe("degraded");
    expect(client.requests).toEqual([]);
  });
});
