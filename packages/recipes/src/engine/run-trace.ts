import type { RunFailureCode } from "./run-failure";
import type { StepKind } from "./step-executor";

/**
 * What a run records about one step. It never holds a response body or a value, so a trace can
 * be logged and stored with a build without leaking data.
 */
export interface TraceEntry {
  readonly step: string;
  readonly kind: StepKind;
  readonly durationMs: number;
  /** Bytes fetched from a source; 0 for a step that fetched nothing. */
  readonly bytes: number;
  readonly outcome: "ok" | RunFailureCode;
}
