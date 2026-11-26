import { recipeSchema } from "@repo/contracts/recipe/recipe-schema";
import { createFakeClock } from "@repo/core/time/testing/fake-clock";
import { CATALOG_ENDPOINTS } from "@repo/db/seed/catalog/catalog-endpoints";
import { runRecipe } from "@repo/recipes/engine/run-recipe";
import { applyFirewall } from "@repo/recipes/firewall/apply-firewall";
import type { EndpointData } from "@repo/recipes/ports/endpoint-reader";
import { createFakeEndpointReader } from "@repo/recipes/ports/testing/fake-endpoint-reader";
import { createRecordedFetch } from "@repo/recipes/recording/testing/recorded-fetch";
import { STEP_EXECUTORS } from "@repo/recipes/steps/step-executors";
import { describe, expect, it } from "vitest";
import { CATALOG_RECORDINGS } from "./testing/catalog-recordings";

/** What each catalog endpoint must yield from the recordings. */
const EXPECTED: Readonly<Record<string, EndpointData>> = {
  ep_core_topeka_weather: {
    station: "Topeka, Philip Billard Municipal Airport",
    conditions: "Clear",
    temperature_c: 9,
    wind_kmh: 29.6,
    humidity_percent: 46,
  },
  ep_core_treasury_interest_rates: {
    record_date: "2026-10-31",
    bills_percent: 4.014,
    notes_percent: 3.399,
    marketable_percent: 3.57,
  },
  ep_core_frankfurt_weather: {
    station: "10637",
    temperature_c: 0.6,
    humidity_percent: 92,
    pressure_hpa: 1015.6,
  },
  ep_core_latest_exploited_vulnerability: {
    cve_id: "CVE-2026-129448",
    vendor: "Apache",
    product: "Roller",
    vulnerability: "Apache Roller Deserialization of Untrusted Data Vulnerability",
    date_added: "2026-11-20",
    catalog_entries: 25,
  },
  ep_core_weather_difference: { topeka_c: 9, frankfurt_c: 0.6, difference_c: 8.4 },
  ep_core_nanterre_address: {
    label: "8 Rue du Port 92000 Nanterre",
    latitude: 48.893461,
    longitude: 2.178892,
    postcode: "92000",
    city: "Nanterre",
  },
};

describe("catalog endpoints", () => {
  it.each(
    CATALOG_ENDPOINTS.map((seed) => [seed.id, seed] as const),
  )("%s yields its value from recorded responses, through the firewall", async (id, seed) => {
    const deps = {
      fetch: createRecordedFetch(CATALOG_RECORDINGS),
      readEndpoint: createFakeEndpointReader({
        "@core/topeka-weather": EXPECTED.ep_core_topeka_weather ?? {},
        "@core/frankfurt-weather": EXPECTED.ep_core_frankfurt_weather ?? {},
      }),
      clock: createFakeClock(new Date("2026-11-22T21:07:00.000Z")),
    };

    const run = await runRecipe(recipeSchema.parse(seed.recipe), deps, STEP_EXECUTORS);
    const data = run.result.ok ? run.result.value.data : null;

    expect(applyFirewall(data, seed.definition.output_spec)).toEqual({
      ok: true,
      value: EXPECTED[id],
    });
  });
});
