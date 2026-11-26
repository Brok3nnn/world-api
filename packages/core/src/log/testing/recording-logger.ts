import type { LogFields, Logger, LogLevel } from "../logger";

export interface LogEntry {
  readonly level: LogLevel;
  readonly event: string;
  readonly fields: LogFields;
}

/** A logger that keeps what it was told, so a test can assert on it. */
export interface RecordingLogger extends Logger {
  readonly entries: readonly LogEntry[];
}

export function createRecordingLogger(): RecordingLogger {
  const entries: LogEntry[] = [];
  return {
    entries,
    log(level, event, fields = {}) {
      entries.push({ level, event, fields });
    },
  };
}
