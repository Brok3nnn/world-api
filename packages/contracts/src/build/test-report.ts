import { z } from "zod";

const REASON_MAX_LENGTH = 300;
const TRIAL_RUNS_MAX = 20;

/** The checks a draft must pass in the test stage, in the order they are evaluated. */
export const testCheckSchema = z.enum([
  "runs",
  "success",
  "schema",
  "stability",
  "plausibility",
  "policy",
  "cost",
]);

export type TestCheck = z.infer<typeof testCheckSchema>;

const trialRunSchema = z.strictObject({
  index: z.int().nonnegative(),
  ok: z.boolean(),
  duration_ms: z.int().nonnegative(),
  /** Why the run failed; absent when it passed. */
  failure: z.string().min(1).max(REASON_MAX_LENGTH).optional(),
});

const failedCheckSchema = z.strictObject({
  check: testCheckSchema,
  reason: z.string().min(1).max(REASON_MAX_LENGTH),
  /** The trial run that showed the failure, when one run did. */
  run: z.int().nonnegative().optional(),
});

/**
 * The evidence of the test stage, stored with the recipe version it justifies. A report passes
 * exactly when no check failed.
 */
export const testReportSchema = z
  .strictObject({
    passed: z.boolean(),
    runs: z.array(trialRunSchema).max(TRIAL_RUNS_MAX),
    failed_checks: z.array(failedCheckSchema),
  })
  .refine((report) => report.passed === (report.failed_checks.length === 0), {
    path: ["passed"],
    message: "A report passes exactly when it has no failed checks.",
  });

export type TestReport = z.infer<typeof testReportSchema>;
