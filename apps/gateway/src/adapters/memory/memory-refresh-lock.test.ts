import { describe, expect, it } from "vitest";
import { testId } from "../../testing/test-deps";
import { createMemoryRefreshLock } from "./memory-refresh-lock";

const VIENNA = testId("endpoint", "ep_weather_now_vienna");
const GRAZ = testId("endpoint", "ep_weather_now_graz");

describe("createMemoryRefreshLock", () => {
  it("runs one refresh per endpoint; a caller that finds one running waits for it and gets null", async () => {
    const lock = createMemoryRefreshLock();
    let finish: () => void = () => undefined;
    const holding = lock.withLock(
      VIENNA,
      () =>
        new Promise<string>((resolve) => {
          finish = () => resolve("refreshed");
        }),
    );
    const waiting = lock.withLock(VIENNA, async () => "second");

    finish();

    expect(await Promise.all([holding, waiting])).toEqual(["refreshed", null]);
  });

  it("lets different endpoints refresh at the same time, and frees the lock afterwards", async () => {
    const lock = createMemoryRefreshLock();

    expect(
      await Promise.all([lock.withLock(VIENNA, async () => 1), lock.withLock(GRAZ, async () => 2)]),
    ).toEqual([1, 2]);
    expect(await lock.withLock(VIENNA, async () => 3)).toBe(3);
  });
});
