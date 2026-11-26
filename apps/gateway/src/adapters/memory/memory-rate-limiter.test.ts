import { createFakeClock } from "@repo/core/time/testing/fake-clock";
import { describe, expect, it } from "vitest";
import { createMemoryRateLimiter } from "./memory-rate-limiter";

const RATE = { burst: 3, perSecond: 0.5 };

function limiter() {
  const clock = createFakeClock(new Date("2026-11-22T10:00:00.000Z"));
  return { clock, rates: createMemoryRateLimiter(clock) };
}

describe("createMemoryRateLimiter", () => {
  it("lets a burst through, then says how long to wait for the next call", async () => {
    const { rates } = limiter();

    const decisions = [];
    for (let call = 0; call < 4; call += 1) {
      decisions.push(await rates.take("address:a", RATE));
    }

    expect(decisions).toEqual([
      { allowed: true },
      { allowed: true },
      { allowed: true },
      { allowed: false, retryAfterS: 2 },
    ]);
  });

  it("refills with time, never beyond the burst", async () => {
    const { clock, rates } = limiter();
    for (let call = 0; call < 3; call += 1) {
      await rates.take("address:a", RATE);
    }

    clock.advance(2);
    expect(await rates.take("address:a", RATE)).toEqual({ allowed: true });
    expect(await rates.take("address:a", RATE)).toEqual({ allowed: false, retryAfterS: 2 });
    clock.advance(3_600);
    const afterAnHour = [];
    for (let call = 0; call < 4; call += 1) {
      afterAnHour.push((await rates.take("address:a", RATE)).allowed);
    }
    expect(afterAnHour).toEqual([true, true, true, false]);
  });

  it("counts each key on its own", async () => {
    const { rates } = limiter();
    const one = { burst: 1, perSecond: 1 };

    expect([
      (await rates.take("address:a", one)).allowed,
      (await rates.take("address:b", one)).allowed,
    ]).toEqual([true, true]);
  });
});
