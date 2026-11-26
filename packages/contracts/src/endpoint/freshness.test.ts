import { describe, expect, it } from "vitest";
import { freshnessSchema } from "./freshness";

describe("freshnessSchema", () => {
  it("lists exactly the members the glossary names", () => {
    expect(freshnessSchema.options).toEqual(["1m", "5m", "15m", "1h", "1d"]);
  });

  it.each(freshnessSchema.options)("accepts %s", (member) => {
    expect(freshnessSchema.parse(member)).toBe(member);
  });

  it("rejects a value that is not a member", () => {
    expect(freshnessSchema.safeParse("30s").success).toBe(false);
  });

  it("rejects a member in another letter case", () => {
    expect(freshnessSchema.safeParse("1M").success).toBe(false);
  });
});
