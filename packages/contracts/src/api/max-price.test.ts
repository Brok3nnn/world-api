import { describe, expect, it } from "vitest";
import { maxPriceSchema } from "./max-price";

describe("maxPriceSchema", () => {
  it.each([
    ["0", 0],
    ["5", 5],
    ["1000000", 1_000_000],
  ])("reads %s as %i credits", (text, credits) => {
    expect(maxPriceSchema.parse(text)).toBe(credits);
  });

  it.each([
    ["a fraction", "0.5"],
    ["a sign", "-1"],
    ["a leading zero", "05"],
    ["more than the limit", "1000001"],
    ["a currency", "$1"],
    ["nothing", ""],
  ])("rejects %s", (_rule, text) => {
    expect(maxPriceSchema.safeParse(text).success).toBe(false);
  });
});
