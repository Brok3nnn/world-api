import type { BuildEvent } from "../build-event";
import type { StageFailure, StageFailureCode } from "../stage-failure";
import type { TestReport } from "../test-report";

export const BUILD_EVENT_EXAMPLE = {
  build_id: "bld_01jd3k8m4q0000000000000000",
  stage: "test",
  kind: "progress",
  message: "Trial run 12 of 20 passed.",
  detail: { run: 12, of: 20 },
  at: "2026-11-21T11:49:10Z",
} satisfies BuildEvent;

export const PASSING_TEST_REPORT_EXAMPLE = {
  passed: true,
  runs: [0, 1, 2, 3, 4].map((index) => ({ index, ok: true, duration_ms: 320 + index })),
  failed_checks: [],
} satisfies TestReport;

export const FAILING_TEST_REPORT_EXAMPLE = {
  passed: false,
  runs: [
    { index: 0, ok: true, duration_ms: 310 },
    { index: 1, ok: false, duration_ms: 95, failure: "The selector matched nothing." },
  ],
  failed_checks: [
    { check: "success", reason: "Run 1 did not complete.", run: 1 },
    { check: "runs", reason: "Only 2 of the 5 required trial runs were made." },
  ],
} satisfies TestReport;

/** One failure per code, at the stage that produces it. */
export const STAGE_FAILURE_EXAMPLES = {
  not_a_data_request: {
    stage: "interpret",
    code: "not_a_data_request",
    message: "This asks for an action, not for data.",
  },
  prohibited_category: {
    stage: "interpret",
    code: "prohibited_category",
    message: "Data about identifiable people is never built.",
  },
  no_source: { stage: "discover", code: "no_source", message: "No approved source offers this." },
  policy_blocked: {
    stage: "check-policy",
    code: "policy_blocked",
    message: "The only source forbids automated access.",
  },
  model_unavailable: {
    stage: "draft",
    code: "model_unavailable",
    message: "The model did not answer in time.",
  },
  draft_invalid: {
    stage: "draft",
    code: "draft_invalid",
    message: "No valid recipe was produced in three attempts.",
  },
  tests_failed: {
    stage: "test",
    code: "tests_failed",
    message: "The recipe did not pass its trial runs.",
  },
  cost_cap_exceeded: {
    stage: "draft",
    code: "cost_cap_exceeded",
    message: "The build reached its cost cap.",
  },
  publish_failed: {
    stage: "publish",
    code: "publish_failed",
    message: "The endpoint could not be stored.",
  },
} satisfies Record<StageFailureCode, StageFailure>;
