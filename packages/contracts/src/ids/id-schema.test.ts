import { describe, expect, it } from "vitest";
import { ID_PREFIXES, type IdKind, idSchema } from "./id-schema";

// Safe: Object.keys returns exactly the keys of this constant object, typed as string[].
const ID_KINDS = Object.keys(ID_PREFIXES) as IdKind[];

describe("ID_PREFIXES", () => {
  it("gives every kind a different prefix", () => {
    const prefixes = Object.values(ID_PREFIXES);

    expect(new Set(prefixes).size).toBe(prefixes.length);
  });
});

describe("idSchema", () => {
  it.each(ID_KINDS)("accepts an id that starts with the prefix of %s", (kind) => {
    const id = `${ID_PREFIXES[kind]}_01jd3k8m4q`;

    expect(idSchema(kind).parse(id)).toBe(id);
  });

  it("accepts underscores and digits in the body", () => {
    expect(idSchema("endpoint").safeParse("ep_rooftop_pm25").success).toBe(true);
  });

  it("accepts a body of 64 characters", () => {
    expect(idSchema("endpoint").safeParse(`ep_${"a".repeat(64)}`).success).toBe(true);
  });

  it("rejects the prefix of another kind", () => {
    expect(idSchema("endpoint").safeParse("bld_01jd3k8m4q").success).toBe(false);
  });

  it("rejects a prefix that only starts like the expected one", () => {
    expect(idSchema("endpoint").safeParse("epx_01jd3k8m4q").success).toBe(false);
  });

  it.each([
    ["an empty body", "ep_"],
    ["a missing underscore", "ep01jd3k8m4q"],
    ["an uppercase letter", "ep_01JD3K8M4Q"],
    ["a hyphen", "ep_rooftop-pm25"],
    ["a space", "ep_rooftop pm25"],
    ["surrounding text", " ep_rooftop "],
    ["a body of 65 characters", `ep_${"a".repeat(65)}`],
  ])("rejects %s", (_rule, value) => {
    expect(idSchema("endpoint").safeParse(value).success).toBe(false);
  });

  it("rejects a value that is not a string", () => {
    expect(idSchema("endpoint").safeParse(42).success).toBe(false);
  });
});
