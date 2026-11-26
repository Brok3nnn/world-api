import { ID_PREFIXES, type IdKind, idSchema } from "@repo/contracts/ids";
import { describe, expect, expectTypeOf, it } from "vitest";
import { createFakeClock } from "../time/testing/fake-clock";
import { createIdGenerator } from "./create-id-generator";
import type { BuildId } from "./id";
import { createFakeRandomSource } from "./testing/fake-random-source";

const START = new Date("2026-11-21T12:00:00.000Z");
// Safe: Object.keys returns exactly the keys of this constant object, typed as string[].
const ID_KINDS = Object.keys(ID_PREFIXES) as IdKind[];

function createGenerator(start = START) {
  const clock = createFakeClock(start);
  return { clock, ids: createIdGenerator({ clock, random: createFakeRandomSource() }) };
}

describe("createIdGenerator", () => {
  it.each(ID_KINDS)("creates an id of kind %s that its schema accepts", (kind) => {
    const { ids } = createGenerator();

    expect(idSchema(kind).safeParse(ids.newId(kind)).success).toBe(true);
  });

  it("types the id by its kind", () => {
    const { ids } = createGenerator();

    expectTypeOf(ids.newId("build")).toEqualTypeOf<BuildId>();
  });

  it("creates the prefix, ten time symbols and sixteen random symbols", () => {
    const { ids } = createGenerator();

    expect(ids.newId("endpoint")).toMatch(/^ep_[0-9a-z]{26}$/);
  });

  it("encodes the start of time as zeros", () => {
    const { ids } = createGenerator(new Date(0));

    expect(ids.newId("endpoint").slice(0, 13)).toBe("ep_0000000000");
  });

  it("creates the same id for the same time and random bytes", () => {
    expect(createGenerator().ids.newId("endpoint")).toBe(createGenerator().ids.newId("endpoint"));
  });

  it("creates different ids within the same millisecond", () => {
    const { ids } = createGenerator();

    expect(ids.newId("endpoint")).not.toBe(ids.newId("endpoint"));
  });

  it("creates ids that sort in the order they were created", () => {
    const { clock, ids } = createGenerator();
    const first = ids.newId("endpoint");

    clock.advance(1);
    const second = ids.newId("endpoint");
    clock.advance(86_400 * 365);
    const third = ids.newId("endpoint");

    expect([third, first, second].sort()).toEqual([first, second, third]);
  });

  it("refuses a random source that returns the wrong number of bytes", () => {
    const ids = createIdGenerator({
      clock: createFakeClock(START),
      random: { bytes: () => new Uint8Array(4) },
    });

    expect(() => ids.newId("endpoint")).toThrow("Random source returned 4 bytes, expected 16.");
  });
});
