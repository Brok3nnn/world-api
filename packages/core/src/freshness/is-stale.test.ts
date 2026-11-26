import { describe, expect, it } from "vitest";
import { isStale } from "./is-stale";

const FETCHED_AT = new Date("2026-11-21T12:00:00Z");

describe("isStale", () => {
  it("is false for a value that was just fetched", () => {
    expect(isStale(FETCHED_AT, 60, FETCHED_AT)).toBe(false);
  });

  it("is false one second before the value reaches the accepted age", () => {
    expect(isStale(FETCHED_AT, 60, new Date("2026-11-21T12:00:59Z"))).toBe(false);
  });

  it("is true exactly when the value reaches the accepted age", () => {
    expect(isStale(FETCHED_AT, 60, new Date("2026-11-21T12:01:00Z"))).toBe(true);
  });

  it("is true long after", () => {
    expect(isStale(FETCHED_AT, 60, new Date("2026-11-22T12:00:00Z"))).toBe(true);
  });

  it("counts only whole seconds", () => {
    expect(isStale(FETCHED_AT, 60, new Date("2026-11-21T12:00:59.999Z"))).toBe(false);
  });
});
