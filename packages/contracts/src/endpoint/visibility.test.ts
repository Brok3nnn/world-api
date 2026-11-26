import { describe, expect, it } from "vitest";
import { visibilitySchema } from "./visibility";

describe("visibilitySchema", () => {
  it("lists exactly the members the glossary names", () => {
    expect(visibilitySchema.options).toEqual(["private", "unlisted", "public"]);
  });

  it.each(visibilitySchema.options)("accepts %s", (member) => {
    expect(visibilitySchema.parse(member)).toBe(member);
  });

  it("rejects a value that is not a member", () => {
    expect(visibilitySchema.safeParse("hidden").success).toBe(false);
  });

  it("rejects a member in another letter case", () => {
    expect(visibilitySchema.safeParse("PRIVATE").success).toBe(false);
  });
});
