import type { Wait } from "../wait";

/** A `Wait` whose timers fire only when the test calls `expire`. */
export interface FakeWait {
  readonly wait: Wait;
  /** The duration of every timer started so far, in milliseconds. */
  readonly started: readonly number[];
  /** The signals of every timer started so far. */
  readonly signals: readonly AbortSignal[];
  expire(): void;
}

export function createFakeWait(): FakeWait {
  const started: number[] = [];
  const signals: AbortSignal[] = [];
  const pending: (() => void)[] = [];
  const wait: Wait = (ms, signal) => {
    started.push(ms);
    signals.push(signal);
    return new Promise((resolve) => {
      pending.push(() => {
        if (!signal.aborted) {
          resolve();
        }
      });
    });
  };
  return {
    wait,
    started,
    signals,
    expire: () => {
      for (const fire of pending.splice(0)) {
        fire();
      }
    },
  };
}
