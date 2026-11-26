import { describe, expect, expectTypeOf, it } from "vitest";
import { type BuildId, type EndpointId, parseId } from "./id";

describe("parseId", () => {
  it("returns the id when it has the prefix and shape of its kind", () => {
    expect(parseId("endpoint", "ep_01jd3k8m4q")).toEqual({ ok: true, value: "ep_01jd3k8m4q" });
  });

  it("fails with the kind when the prefix belongs to another kind", () => {
    expect(parseId("endpoint", "bld_01jd3k8m4q")).toEqual({
      ok: false,
      error: { code: "invalid_id", kind: "endpoint" },
    });
  });

  it("fails for a value that is not a string", () => {
    expect(parseId("build", 42).ok).toBe(false);
  });

  it("types the parsed id by its kind", () => {
    const parsed = parseId("endpoint", "ep_01jd3k8m4q");

    if (parsed.ok) {
      expectTypeOf(parsed.value).toEqualTypeOf<EndpointId>();
    }
  });
});

describe("Id", () => {
  it("is a string", () => {
    expectTypeOf<EndpointId>().toExtend<string>();
  });

  it("of one kind cannot be used as an id of another kind", () => {
    expectTypeOf<EndpointId>().not.toExtend<BuildId>();
  });

  it("cannot be created from a plain string without parsing", () => {
    expectTypeOf<string>().not.toExtend<EndpointId>();
  });
});
