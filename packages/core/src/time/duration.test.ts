import { describe, expect, it } from "vitest";
import { addSeconds, secondsBetween } from "./duration";

const NOON = new Date("2026-11-21T12:00:00.000Z");

describe("addSeconds", () => {
  it("returns the instant that many seconds later", () => {
    expect(addSeconds(NOON, 90)).toEqual(new Date("2026-11-21T12:01:30.000Z"));
  });

  it("returns an earlier instant for a negative number of seconds", () => {
    expect(addSeconds(NOON, -60)).toEqual(new Date("2026-11-21T11:59:00.000Z"));
  });

  it("returns an equal instant for zero seconds", () => {
    expect(addSeconds(NOON, 0)).toEqual(NOON);
  });

  it("does not change the instant it was given", () => {
    const instant = new Date(NOON);

    addSeconds(instant, 3600);

    expect(instant).toEqual(NOON);
  });
});

describe("secondsBetween", () => {
  it("counts the whole seconds from the earlier to the later instant", () => {
    expect(secondsBetween(NOON, new Date("2026-11-21T12:01:30.000Z"))).toBe(90);
  });

  it("rounds a partial second down", () => {
    expect(secondsBetween(NOON, new Date("2026-11-21T12:00:01.999Z"))).toBe(1);
  });

  it("is zero for the same instant", () => {
    expect(secondsBetween(NOON, NOON)).toBe(0);
  });

  it("is negative when the later instant comes first", () => {
    expect(secondsBetween(NOON, new Date("2026-11-21T11:59:00.000Z"))).toBe(-60);
  });
});
