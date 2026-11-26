import { describe, expect, it } from "vitest";
import { effectiveMaxAge } from "./effective-max-age";

describe("effectiveMaxAge", () => {
  it("is the freshness interval when the caller asks for nothing", () => {
    expect(effectiveMaxAge("15m")).toBe(900);
  });

  it("is the caller's max_age when it is larger than the interval", () => {
    expect(effectiveMaxAge("15m", 3600)).toBe(3600);
  });

  it("raises a max_age below the interval to the interval", () => {
    expect(effectiveMaxAge("15m", 60)).toBe(900);
  });

  it("is the interval when max_age is exactly the interval", () => {
    expect(effectiveMaxAge("15m", 900)).toBe(900);
  });

  it("raises a max_age one second below the floor and keeps one second above it", () => {
    expect(effectiveMaxAge("1m", 59)).toBe(60);
    expect(effectiveMaxAge("1m", 61)).toBe(61);
  });
});
