import { parseId } from "@repo/core/ids/id";
import { afterEach, describe, expect, it } from "vitest";
import type { StoredValue, ValueStore } from "../value-store";

/** A store, empty, and how to release it. */
export interface ValueStoreUnderTest {
  readonly store: ValueStore;
  readonly close: () => Promise<void>;
}

function ids() {
  const endpoint = parseId("endpoint", "ep_weather_now");
  const recipe = parseId("recipeVersion", "rv_weather_now_1");
  const value = parseId("value", "val_weather_now_1");
  if (!endpoint.ok || !recipe.ok || !value.ok) {
    throw new Error("The test ids are not valid ids.");
  }
  return { endpoint: endpoint.value, recipe: recipe.value, value: value.value };
}

function storedValue(temperature: number, fetchedAt: string): StoredValue {
  return {
    data: { temperature_c: temperature },
    asOf: new Date("2026-11-22T09:55:00.000Z"),
    fetchedAt: new Date(fetchedAt),
    expiresAt: new Date(Date.parse(fetchedAt) + 900_000),
    recipeVersionId: ids().recipe,
  };
}

/**
 * What every `ValueStore` adapter must do; each adapter's test runs these. `setup` receives the
 * endpoint and recipe version the store must accept values for.
 */
export function describeValueStore(
  name: string,
  setup: (endpoint: ReturnType<typeof ids>) => Promise<ValueStoreUnderTest>,
): void {
  describe(`${name} as a ValueStore`, () => {
    let underTest: ValueStoreUnderTest | undefined;

    async function store(): Promise<ValueStore> {
      underTest = await setup(ids());
      return underTest.store;
    }

    afterEach(async () => {
      await underTest?.close();
    });

    it("has no value and no failures for an endpoint never refreshed", async () => {
      expect(await (await store()).readLatest(ids().endpoint)).toEqual({
        value: null,
        consecutiveFailures: 0,
      });
    });

    it("returns the value stored last", async () => {
      const values = await store();

      await values.storeRefreshed(ids().endpoint, storedValue(4.2, "2026-11-22T10:00:00.000Z"));
      await values.storeRefreshed(ids().endpoint, storedValue(5.1, "2026-11-22T10:15:00.000Z"));

      expect(await values.readLatest(ids().endpoint)).toEqual({
        value: storedValue(5.1, "2026-11-22T10:15:00.000Z"),
        consecutiveFailures: 0,
      });
    });

    it("counts failures in a row and keeps the value, until a value is stored again", async () => {
      const values = await store();
      const value = storedValue(4.2, "2026-11-22T10:00:00.000Z");
      await values.storeRefreshed(ids().endpoint, value);

      expect(await values.recordFailure(ids().endpoint, "fetch_failed at now")).toBe(1);
      expect(await values.recordFailure(ids().endpoint, "fetch_failed at now")).toBe(2);
      expect(await values.readLatest(ids().endpoint)).toEqual({ value, consecutiveFailures: 2 });
      await values.storeRefreshed(ids().endpoint, value);
      expect((await values.readLatest(ids().endpoint)).consecutiveFailures).toBe(0);
    });

    it("accepts a history entry", async () => {
      const values = await store();
      const { endpoint, recipe, value } = ids();

      await expect(
        values.appendHistory({
          id: value,
          endpointId: endpoint,
          data: { temperature_c: 4.2 },
          asOf: new Date("2026-11-22T09:55:00.000Z"),
          recipeVersionId: recipe,
        }),
      ).resolves.toBeUndefined();
    });
  });
}
