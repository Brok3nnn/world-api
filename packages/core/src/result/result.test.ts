import { describe, expect, expectTypeOf, it } from "vitest";
import { err, ok, type Result } from "./result";

function half(value: number): Result<number, "odd"> {
  return value % 2 === 0 ? ok(value / 2) : err("odd");
}

describe("ok", () => {
  it("carries the value of a success", () => {
    expect(ok(7)).toEqual({ ok: true, value: 7 });
  });
});

describe("err", () => {
  it("carries the error of a failure", () => {
    expect(err("not_found")).toEqual({ ok: false, error: "not_found" });
  });
});

describe("Result", () => {
  it("narrows to the value when ok is true", () => {
    const result = half(8);

    expect(result.ok && result.value).toBe(4);
  });

  it("narrows to the error when ok is false", () => {
    const result = half(7);

    expect(!result.ok && result.error).toBe("odd");
  });

  it("gives a success the value type and a failure the error type", () => {
    const result = half(8);

    if (result.ok) {
      expectTypeOf(result.value).toEqualTypeOf<number>();
    } else {
      expectTypeOf(result.error).toEqualTypeOf<"odd">();
    }
  });
});
