import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { timersWait } from "./timers-wait";

/** Starts a wait and reports whether it has settled, after letting promises run. */
function start(ms: number, signal: AbortSignal) {
  let settled = false;
  void timersWait(ms, signal).then(() => {
    settled = true;
  });
  return async () => {
    await Promise.resolve();
    return settled;
  };
}

describe("timersWait", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("settles once the time has passed, and not before", async () => {
    const settled = start(1000, new AbortController().signal);

    vi.advanceTimersByTime(999);
    expect(await settled()).toBe(false);
    vi.advanceTimersByTime(1);
    expect(await settled()).toBe(true);
  });

  it("never settles and leaves no timer once its signal aborts", async () => {
    const controller = new AbortController();
    const settled = start(1000, controller.signal);

    controller.abort();
    vi.advanceTimersByTime(5000);

    expect(await settled()).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("starts no timer for a signal that has already aborted", async () => {
    const controller = new AbortController();
    controller.abort();

    const settled = start(1000, controller.signal);

    expect(await settled()).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });
});
