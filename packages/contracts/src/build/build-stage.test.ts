import { describe, expect, it } from "vitest";
import { buildStageSchema } from "./build-stage";

describe("buildStageSchema", () => {
  it("lists the stages in the order the pipeline runs them", () => {
    expect(buildStageSchema.options).toEqual([
      "interpret",
      "discover",
      "check-policy",
      "draft",
      "test",
      "publish",
    ]);
  });

  it("rejects a stage that is not listed", () => {
    expect(buildStageSchema.safeParse("repair").success).toBe(false);
  });
});
