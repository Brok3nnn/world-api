import { describe, expect, it } from "vitest";
import { integerText } from "./integer-text";

const zeroToThirty = integerText({ min: 0, max: 30 });

describe("integerText", () => {
  it.each([
    ["the lower bound", "0", 0],
    ["a value inside the range", "12", 12],
    ["the upper bound", "30", 30],
  ])("parses %s to a number", (_rule, text, value) => {
    expect(zeroToThirty.parse(text)).toBe(value);
  });

  it.each([
    ["a value above the range", "31"],
    ["a negative number", "-1"],
    ["a plus sign", "+5"],
    ["a leading zero", "05"],
    ["a decimal", "1.5"],
    ["an exponent", "1e1"],
    ["a space", " 5"],
    ["letters", "five"],
    ["nothing", ""],
    ["more than nine digits", "1234567890"],
  ])("rejects %s", (_rule, text) => {
    expect(zeroToThirty.safeParse(text).success).toBe(false);
  });

  it("rejects a value below the range", () => {
    expect(integerText({ min: 1, max: 30 }).safeParse("0").success).toBe(false);
  });

  it("rejects a value that is already a number", () => {
    expect(zeroToThirty.safeParse(5).success).toBe(false);
  });
});
