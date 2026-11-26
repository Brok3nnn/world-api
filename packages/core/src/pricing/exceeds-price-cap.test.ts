import { describe, expect, it } from "vitest";
import { exceedsPriceCap } from "./exceeds-price-cap";

describe("exceedsPriceCap", () => {
  it("is false when the call costs less than the cap", () => {
    expect(exceedsPriceCap(9, 10)).toBe(false);
  });

  it("is false when the call costs exactly the cap", () => {
    expect(exceedsPriceCap(10, 10)).toBe(false);
  });

  it("is true when the call costs one credit more than the cap", () => {
    expect(exceedsPriceCap(11, 10)).toBe(true);
  });

  it("is true for any priced call when the cap is zero", () => {
    expect(exceedsPriceCap(1, 0)).toBe(true);
  });

  it("is false for a free call whatever the cap", () => {
    expect(exceedsPriceCap(0, 0)).toBe(false);
  });
});
