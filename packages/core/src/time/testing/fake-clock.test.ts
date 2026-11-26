import { describe, expect, it } from "vitest";
import { createFakeClock } from "./fake-clock";

const START = new Date("2026-11-21T12:00:00.000Z");

describe("createFakeClock", () => {
  it("starts at the given instant", () => {
    expect(createFakeClock(START).now()).toEqual(START);
  });

  it("does not move on its own", () => {
    const clock = createFakeClock(START);

    expect(clock.now()).toEqual(clock.now());
  });

  it("moves forward by the seconds it is advanced", () => {
    const clock = createFakeClock(START);

    clock.advance(75);

    expect(clock.now()).toEqual(new Date("2026-11-21T12:01:15.000Z"));
  });

  it("jumps to the instant it is set to", () => {
    const clock = createFakeClock(START);
    const later = new Date("2027-01-01T00:00:00.000Z");

    clock.set(later);

    expect(clock.now()).toEqual(later);
  });

  it("is not moved by changing a date it returned", () => {
    const clock = createFakeClock(START);

    clock.now().setFullYear(1999);

    expect(clock.now()).toEqual(START);
  });

  it("is not moved by changing the date it was started with", () => {
    const start = new Date(START);
    const clock = createFakeClock(start);

    start.setFullYear(1999);

    expect(clock.now()).toEqual(START);
  });
});
