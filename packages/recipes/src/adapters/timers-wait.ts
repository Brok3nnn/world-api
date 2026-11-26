import type { Wait } from "../ports/wait";

/** The `Wait` of commands and entries, on the runtime's timers. Aborting clears the timer. */
export const timersWait: Wait = (ms, signal) =>
  new Promise((resolve) => {
    if (signal.aborted) {
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => clearTimeout(timer), { once: true });
  });
