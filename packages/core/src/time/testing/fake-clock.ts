import type { Clock } from "../clock";
import { addSeconds } from "../duration";

/** A clock that only moves when a test tells it to. */
export interface FakeClock extends Clock {
  advance(seconds: number): void;
  set(instant: Date): void;
}

export function createFakeClock(start: Date): FakeClock {
  let current = new Date(start);
  return {
    // A copy, so a caller that mutates the returned date cannot move the clock.
    now: () => new Date(current),
    advance(seconds) {
      current = addSeconds(current, seconds);
    },
    set(instant) {
      current = new Date(instant);
    },
  };
}
