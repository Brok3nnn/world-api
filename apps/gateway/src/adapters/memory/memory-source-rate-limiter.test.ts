import { createFakeClock } from "@repo/core/time/testing/fake-clock";
import { describe, expect, it } from "vitest";
import { testId } from "../../testing/test-deps";
import { createMemorySourceRateLimiter } from "./memory-source-rate-limiter";

const WEATHER = testId("source", "src_weather");
const MARKET = testId("source", "src_market");

describe("createMemorySourceRateLimiter", () => {
  it("allows a source its limit within a minute, then again once the minute is over", () => {
    const clock = createFakeClock(new Date("2026-11-22T10:00:00.000Z"));
    const limiter = createMemorySourceRateLimiter(clock);

    expect([1, 2, 3].map(() => limiter.allow(WEATHER, 2))).toEqual([true, true, false]);
    clock.advance(59);
    expect(limiter.allow(WEATHER, 2)).toBe(false);
    clock.advance(1);
    expect(limiter.allow(WEATHER, 2)).toBe(true);
  });

  it("counts each source on its own", () => {
    const limiter = createMemorySourceRateLimiter(
      createFakeClock(new Date("2026-11-22T10:00:00.000Z")),
    );

    expect([
      limiter.allow(WEATHER, 1),
      limiter.allow(MARKET, 1),
      limiter.allow(WEATHER, 1),
    ]).toEqual([true, true, false]);
  });
});
