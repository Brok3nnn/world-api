import { describe, expect, it } from "vitest";
import { shapeSchema } from "./shape";

describe("shapeSchema", () => {
  it("lists exactly the shapes of the API reference", () => {
    expect(shapeSchema.options).toEqual(["json", "number", "text", "csv"]);
  });

  it.each(shapeSchema.options)("accepts %s", (shape) => {
    expect(shapeSchema.parse(shape)).toBe(shape);
  });

  it.each(["xml", "probability"])("rejects %s, a shape that is not listed", (shape) => {
    expect(shapeSchema.safeParse(shape).success).toBe(false);
  });

  it("rejects a listed shape in another letter case", () => {
    expect(shapeSchema.safeParse("JSON").success).toBe(false);
  });
});
