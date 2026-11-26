import { describe, expect, it } from "vitest";
import { STAGE_FAILURE_EXAMPLES } from "./examples/build-report-examples";
import { STAGE_FAILURE_OUTCOME, stageFailureCodeSchema, stageFailureSchema } from "./stage-failure";

describe("STAGE_FAILURE_OUTCOME", () => {
  it("has an outcome for every code and no other entry", () => {
    expect(Object.keys(STAGE_FAILURE_OUTCOME)).toEqual(stageFailureCodeSchema.options);
  });

  it("rejects what must not or cannot be built and fails the rest", () => {
    expect(STAGE_FAILURE_OUTCOME).toEqual({
      not_a_data_request: "rejected",
      prohibited_category: "rejected",
      no_source: "rejected",
      policy_blocked: "rejected",
      model_unavailable: "failed",
      draft_invalid: "failed",
      tests_failed: "failed",
      cost_cap_exceeded: "failed",
      publish_failed: "failed",
    });
  });
});

describe("stageFailureSchema", () => {
  it.each(Object.entries(STAGE_FAILURE_EXAMPLES))("accepts the example of %s", (code, failure) => {
    expect(stageFailureSchema.parse(failure).code).toBe(code);
  });

  it.each([
    ["an unknown code", { code: "timeout" }],
    ["an unknown stage", { stage: "repair" }],
    ["an empty message", { message: "" }],
    ["a message of 301 characters", { message: "a".repeat(301) }],
    ["a field that is not part of a failure", { retry: true }],
  ])("rejects %s", (_rule, overrides) => {
    const failure = { ...STAGE_FAILURE_EXAMPLES.no_source, ...overrides };

    expect(stageFailureSchema.safeParse(failure).success).toBe(false);
  });
});
