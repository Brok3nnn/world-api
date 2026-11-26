/**
 * The closed list of reasons a run can fail. Each is produced by one step kind or by the
 * engine itself, and the builder reads them to repair a recipe.
 */
export type RunFailureCode =
  | "policy_denied"
  | "fetch_failed"
  | "fetch_timeout"
  | "too_large"
  | "unexpected_content"
  | "selector_empty"
  | "pattern_no_match"
  | "expression_failed"
  | "endpoint_unavailable"
  | "limit_exceeded";

/** Why one step could not produce its result. */
export interface StepFailure {
  readonly code: RunFailureCode;
}

/** Why a run ended without a value: the code, and the id of the step that failed. */
export interface RunFailure {
  readonly code: RunFailureCode;
  readonly step: string;
}
