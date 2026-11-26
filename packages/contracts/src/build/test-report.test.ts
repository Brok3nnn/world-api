import { describe, expect, it } from "vitest";
import {
  FAILING_TEST_REPORT_EXAMPLE,
  PASSING_TEST_REPORT_EXAMPLE,
} from "./examples/build-report-examples";
import { testCheckSchema, testReportSchema } from "./test-report";

const RUN = { index: 0, ok: true, duration_ms: 300 };
const FAILED_CHECK = { check: "schema", reason: "Run 0 returned an extra field." };

function accepts(report: Record<string, unknown>): boolean {
  return testReportSchema.safeParse(report).success;
}

describe("testCheckSchema", () => {
  it("lists the checks of the test stage in order", () => {
    expect(testCheckSchema.options).toEqual([
      "runs",
      "success",
      "schema",
      "stability",
      "plausibility",
      "policy",
      "cost",
    ]);
  });
});

describe("testReportSchema", () => {
  it("accepts the passing example", () => {
    expect(testReportSchema.parse(PASSING_TEST_REPORT_EXAMPLE)).toEqual(
      PASSING_TEST_REPORT_EXAMPLE,
    );
  });

  it("accepts the failing example", () => {
    expect(testReportSchema.parse(FAILING_TEST_REPORT_EXAMPLE)).toEqual(
      FAILING_TEST_REPORT_EXAMPLE,
    );
  });

  it("accepts twenty trial runs", () => {
    const runs = Array.from({ length: 20 }, (_, index) => ({ ...RUN, index }));

    expect(accepts({ passed: true, runs, failed_checks: [] })).toBe(true);
  });

  it("rejects a report that passes although a check failed", () => {
    expect(accepts({ passed: true, runs: [RUN], failed_checks: [FAILED_CHECK] })).toBe(false);
  });

  it("rejects a report that fails although no check failed", () => {
    expect(accepts({ passed: false, runs: [RUN], failed_checks: [] })).toBe(false);
  });

  it.each([
    ["twenty-one trial runs", { runs: Array.from({ length: 21 }, () => RUN) }],
    ["a run with a negative duration", { runs: [{ ...RUN, duration_ms: -1 }] }],
    ["a run with an empty failure", { runs: [{ ...RUN, ok: false, failure: "" }] }],
    ["a run with a field that is not part of a run", { runs: [{ ...RUN, value: 7 }] }],
    ["an unknown check", { failed_checks: [{ ...FAILED_CHECK, check: "speed" }] }],
    ["a failed check without a reason", { failed_checks: [{ check: "schema" }] }],
  ])("rejects %s", (_rule, overrides) => {
    expect(accepts({ ...FAILING_TEST_REPORT_EXAMPLE, ...overrides })).toBe(false);
  });
});
