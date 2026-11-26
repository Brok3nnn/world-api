import { describe, expect, it } from "vitest";
import { GRACE_INTERVALS, withinGrace } from "./within-grace";

const FETCHED_AT = new Date("2026-11-21T12:00:00Z");

describe("withinGrace", () => {
  it("allows three intervals after the value expired", () => {
    expect(GRACE_INTERVALS).toBe(3);
  });

  it("is true while the value is still fresh", () => {
    expect(withinGrace(FETCHED_AT, "1m", new Date("2026-11-21T12:00:30Z"))).toBe(true);
  });

  it("is true right after the value expired", () => {
    expect(withinGrace(FETCHED_AT, "1m", new Date("2026-11-21T12:01:00Z"))).toBe(true);
  });

  it("is true at the last second of the grace period", () => {
    expect(withinGrace(FETCHED_AT, "1m", new Date("2026-11-21T12:03:59Z"))).toBe(true);
  });

  it("is false at the first second after the grace period", () => {
    expect(withinGrace(FETCHED_AT, "1m", new Date("2026-11-21T12:04:00Z"))).toBe(false);
  });

  it("scales with the freshness class", () => {
    expect(withinGrace(FETCHED_AT, "1h", new Date("2026-11-21T15:59:59Z"))).toBe(true);
    expect(withinGrace(FETCHED_AT, "1h", new Date("2026-11-21T16:00:00Z"))).toBe(false);
  });
});
