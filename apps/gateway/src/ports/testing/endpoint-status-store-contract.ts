import { afterEach, describe, expect, it } from "vitest";
import { testId } from "../../testing/test-deps";
import type { EndpointStatusStore } from "../endpoint-status-store";

/** A store holding one live endpoint, `ep_weather_now`, and how to release it. */
export interface StatusStoreUnderTest {
  readonly store: EndpointStatusStore;
  readonly close: () => Promise<void>;
}

/** What every `EndpointStatusStore` adapter must do; each adapter's test runs these. */
export function describeEndpointStatusStore(
  name: string,
  setup: () => Promise<StatusStoreUnderTest>,
): void {
  describe(`${name} as an EndpointStatusStore`, () => {
    let underTest: StatusStoreUnderTest | undefined;
    const ENDPOINT = testId("endpoint", "ep_weather_now");

    afterEach(async () => {
      await underTest?.close();
    });

    it("moves an endpoint from the status it has, and only once", async () => {
      underTest = await setup();

      expect(await underTest.store.move(ENDPOINT, "live", "degraded")).toBe(true);
      expect(await underTest.store.move(ENDPOINT, "live", "degraded")).toBe(false);
      expect(await underTest.store.move(ENDPOINT, "degraded", "live")).toBe(true);
    });
  });
}
