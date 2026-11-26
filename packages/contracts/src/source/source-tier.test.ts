import { describe, expect, it } from "vitest";
import { sourceTierSchema } from "./source-tier";

describe("sourceTierSchema", () => {
  it("lists the tiers of the security documentation", () => {
    expect(sourceTierSchema.options).toEqual(["green", "yellow", "red"]);
  });

  it("rejects a tier that is not listed", () => {
    expect(sourceTierSchema.safeParse("amber").success).toBe(false);
  });
});
