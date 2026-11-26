import type { LogFields, Logger, LogLevel } from "@repo/core/log/logger";
import type { Clock } from "@repo/core/time/clock";

const SEVERITY: Readonly<Record<LogLevel, number>> = { debug: 0, info: 1, warn: 2, error: 3 };

interface StdoutLoggerDeps {
  /** The app that logs, on every line. */
  readonly app: string;
  /** The least severe level written. */
  readonly level: LogLevel;
  readonly clock: Clock;
  /** Writes one finished line; the entry passes standard output. */
  readonly write: (line: string) => void;
}

/** The `Logger` of the Node entry: one JSON object per line, as operations.md describes. */
export function createStdoutLogger(deps: StdoutLoggerDeps): Logger {
  return {
    log(level, event, fields: LogFields = {}) {
      if (SEVERITY[level] < SEVERITY[deps.level]) {
        return;
      }
      const line = { time: deps.clock.now().toISOString(), level, app: deps.app, event, ...fields };
      deps.write(`${JSON.stringify(line)}\n`);
    },
  };
}
