import { describe, expect, it } from "vitest";
import { categorySchema } from "./category";

describe("categorySchema", () => {
  it("lists exactly the members the glossary names", () => {
    expect(categorySchema.options).toEqual([
      "weather",
      "environment",
      "wildlife",
      "finance",
      "energy",
      "transport",
      "developer",
      "knowledge",
      "places",
      "commerce",
      "jobs",
    ]);
  });

  it.each(categorySchema.options)("accepts %s", (member) => {
    expect(categorySchema.parse(member)).toBe(member);
  });

  it("rejects a value that is not a member", () => {
    expect(categorySchema.safeParse("sports").success).toBe(false);
  });

  it("rejects a member in another letter case", () => {
    expect(categorySchema.safeParse("WEATHER").success).toBe(false);
  });
});
