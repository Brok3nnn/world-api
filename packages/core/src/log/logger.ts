export type LogLevel = "debug" | "info" | "warn" | "error";

/** Flat, typed fields of one log line. No nested objects and no free-form text building. */
export type LogFields = Readonly<Record<string, string | number | boolean | null>>;

/**
 * Structured logging: a named event with typed fields. Events are constants of the app that
 * logs them. What must never be logged is listed in docs/architecture/operations.md.
 */
export interface Logger {
  log(level: LogLevel, event: string, fields?: LogFields): void;
}
