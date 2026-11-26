import { z } from "zod";
import { buildStageSchema } from "./build-stage";

const MESSAGE_MAX_LENGTH = 300;

/** Every way a stage can end a build without an endpoint. */
export const stageFailureCodeSchema = z.enum([
  "not_a_data_request",
  "prohibited_category",
  "no_source",
  "policy_blocked",
  "model_unavailable",
  "draft_invalid",
  "tests_failed",
  "cost_cap_exceeded",
  "publish_failed",
]);

export type StageFailureCode = z.infer<typeof stageFailureCodeSchema>;

/**
 * How each failure ends the build. `rejected`: it must not or cannot be built, and trying again
 * will not help. `failed`: the builder could not finish this time.
 */
export const STAGE_FAILURE_OUTCOME = {
  not_a_data_request: "rejected",
  prohibited_category: "rejected",
  no_source: "rejected",
  policy_blocked: "rejected",
  model_unavailable: "failed",
  draft_invalid: "failed",
  tests_failed: "failed",
  cost_cap_exceeded: "failed",
  publish_failed: "failed",
} as const satisfies Record<StageFailureCode, "rejected" | "failed">;

/** What a stage returns instead of its output when it cannot produce one. */
export const stageFailureSchema = z.strictObject({
  stage: buildStageSchema,
  code: stageFailureCodeSchema,
  /** One sentence the requester can read; becomes the build's `reason`. */
  message: z.string().min(1).max(MESSAGE_MAX_LENGTH),
});

export type StageFailure = z.infer<typeof stageFailureSchema>;
