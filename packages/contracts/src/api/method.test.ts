import { describe, expect, it } from "vitest";
import { methodSchema } from "./method";

describe("methodSchema", () => {
  it("lists exactly the methods of the API reference", () => {
    expect(methodSchema.options).toEqual(["computed", "model-estimate", "owner-data"]);
  });

  it.each(methodSchema.options)("accepts %s", (method) => {
    expect(methodSchema.parse(method)).toBe(method);
  });

  it("rejects a method that is not listed", () => {
    expect(methodSchema.safeParse("guessed").success).toBe(false);
  });
});
