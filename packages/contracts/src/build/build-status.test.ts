import { describe, expect, it } from "vitest";
import { buildStatusSchema } from "./build-status";

describe("buildStatusSchema", () => {
  it("lists exactly the statuses of the builder documentation", () => {
    expect(buildStatusSchema.options).toEqual([
      "queued",
      "running",
      "succeeded",
      "failed",
      "rejected",
    ]);
  });

  it("rejects a status that is not listed", () => {
    expect(buildStatusSchema.safeParse("cancelled").success).toBe(false);
  });
});
