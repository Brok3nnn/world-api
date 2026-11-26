import { describe, expect, it } from "vitest";
import { endpointStatusSchema } from "./endpoint-status";

describe("endpointStatusSchema", () => {
  it("lists exactly the members the glossary names", () => {
    expect(endpointStatusSchema.options).toEqual(["building", "live", "degraded", "disabled"]);
  });

  it.each(endpointStatusSchema.options)("accepts %s", (member) => {
    expect(endpointStatusSchema.parse(member)).toBe(member);
  });

  it("rejects a value that is not a member", () => {
    expect(endpointStatusSchema.safeParse("paused").success).toBe(false);
  });

  it("rejects a member in another letter case", () => {
    expect(endpointStatusSchema.safeParse("BUILDING").success).toBe(false);
  });
});
