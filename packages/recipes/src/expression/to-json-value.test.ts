import { describe, expect, it } from "vitest";
import { toJsonValue } from "./to-json-value";

describe("toJsonValue", () => {
  it("copies JSON values as plain data", () => {
    const sequence = Object.assign([1, "a", null, true], { sequence: true });

    expect(toJsonValue({ list: sequence, nested: { ok: false } })).toEqual({
      list: [1, "a", null, true],
      nested: { ok: false },
    });
  });

  it.each([
    ["a function", () => 1],
    ["a function inside an array", [1, () => 1]],
    ["a function inside an object", { a: { b: () => 1 } }],
    ["a number that is not finite", Number.POSITIVE_INFINITY],
    ["nothing", undefined],
  ])("refuses %s", (_case, value) => {
    expect(toJsonValue(value)).toBeUndefined();
  });
});
