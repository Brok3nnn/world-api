import { describe, expect, it } from "vitest";
import type { ValueStore } from "../ports/value-store";
import { servedEndpoint, storedValue, testDeps, valuesWith } from "../testing/test-deps";
import { readValue } from "./read-value";

/** A store that counts its reads. */
function counting(store: ValueStore) {
  let reads = 0;
  const values: ValueStore = {
    ...store,
    readLatest: (endpointId) => {
      reads += 1;
      return store.readLatest(endpointId);
    },
  };
  return { values, reads: () => reads };
}

function read(ageS: number | null, maxAgeS?: number) {
  const store = counting(ageS === null ? testDeps().values : valuesWith(storedValue(ageS)));
  const { clock } = testDeps();
  return {
    reading: readValue(servedEndpoint(), maxAgeS, { values: store.values, clock }),
    reads: store.reads,
  };
}

describe("readValue", () => {
  it("returns a fresh value with exactly one store read", async () => {
    const { reading, reads } = read(899);

    expect(await reading).toEqual({ fresh: true, value: storedValue(899) });
    expect(reads()).toBe(1);
  });

  it("finds a value stale from the instant its age reaches the freshness interval", async () => {
    const { reading } = read(900);

    expect((await reading).fresh).toBe(false);
  });

  it("accepts an older value when the call's max_age allows it", async () => {
    expect((await read(1_500, 1_800).reading).fresh).toBe(true);
  });

  it("raises a max_age below the freshness interval to the interval, the floor", async () => {
    expect((await read(600, 60).reading).fresh).toBe(true);
  });

  it("starts a refresh from nothing for an endpoint never refreshed", async () => {
    expect(await read(null).reading).toEqual({
      fresh: false,
      latest: { value: null, consecutiveFailures: 0 },
    });
  });
});
