import { describe, expect, it } from "vitest";
import { createFakeRandomSource } from "./fake-random-source";

describe("createFakeRandomSource", () => {
  it("returns the requested number of bytes", () => {
    expect(createFakeRandomSource().bytes(16)).toHaveLength(16);
  });

  it("counts up from the seed", () => {
    expect([...createFakeRandomSource(5).bytes(3)]).toEqual([5, 6, 7]);
  });

  it("continues where the previous call stopped", () => {
    const source = createFakeRandomSource();

    source.bytes(2);

    expect([...source.bytes(2)]).toEqual([2, 3]);
  });

  it("wraps around after the largest byte value", () => {
    expect([...createFakeRandomSource(255).bytes(2)]).toEqual([255, 0]);
  });

  it("gives two sources with the same seed the same bytes", () => {
    expect(createFakeRandomSource(9).bytes(8)).toEqual(createFakeRandomSource(9).bytes(8));
  });
});
