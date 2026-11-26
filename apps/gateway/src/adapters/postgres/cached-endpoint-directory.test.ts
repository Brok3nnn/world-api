import type { EndpointPath } from "@repo/contracts/api/endpoint-path";
import { createFakeClock } from "@repo/core/time/testing/fake-clock";
import { describe, expect, it } from "vitest";
import type { EndpointDirectory } from "../../ports/endpoint-directory";
import { servedEndpoint } from "../../testing/test-deps";
import { createCachedEndpointDirectory, DIRECTORY_CACHE } from "./cached-endpoint-directory";

const VIENNA: EndpointPath = { owner: "core", slug: "weather-now-vienna" };

/** A directory that knows one endpoint and counts how often it is asked. */
function countingDirectory() {
  const asked: string[] = [];
  const inner: EndpointDirectory = {
    find: async (path) => {
      asked.push(path.slug);
      return path.slug === VIENNA.slug ? servedEndpoint() : null;
    },
  };
  const clock = createFakeClock(new Date("2026-11-22T10:00:00Z"));
  return { asked, clock, cached: createCachedEndpointDirectory(inner, clock) };
}

describe("createCachedEndpointDirectory", () => {
  it("answers a repeated lookup from the cache until its lifetime ends", async () => {
    const { asked, clock, cached } = countingDirectory();

    await cached.find(VIENNA);
    clock.advance(DIRECTORY_CACHE.lifetimeMs / 1000 - 1);
    expect(await cached.find(VIENNA)).toEqual(servedEndpoint());
    expect(asked).toEqual(["weather-now-vienna"]);

    clock.advance(1);
    await cached.find(VIENNA);
    expect(asked).toEqual(["weather-now-vienna", "weather-now-vienna"]);
  });

  it("keeps an unknown endpoint's answer too", async () => {
    const { asked, cached } = countingDirectory();

    expect(await cached.find({ owner: "core", slug: "unknown" })).toBeNull();
    expect(await cached.find({ owner: "core", slug: "unknown" })).toBeNull();
    expect(asked).toEqual(["unknown"]);
  });

  it("keeps at most its maximum of answers, dropping the oldest first", async () => {
    const { asked, cached } = countingDirectory();

    for (let index = 0; index <= DIRECTORY_CACHE.maxEntries; index += 1) {
      await cached.find({ owner: "core", slug: `endpoint-${index}` });
    }
    await cached.find({ owner: "core", slug: `endpoint-${DIRECTORY_CACHE.maxEntries}` });
    await cached.find({ owner: "core", slug: "endpoint-0" });

    expect(asked.length).toBe(DIRECTORY_CACHE.maxEntries + 2);
    expect(asked.at(-1)).toBe("endpoint-0");
  });
});
