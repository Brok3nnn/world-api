import { describe, expect, it } from "vitest";
import { errorBodySchema } from "../api/error";
import { buildingBodySchema } from "./building-body";
import { BUILDING_BODY_EXAMPLE } from "./examples/universal-entry-examples";

function acceptsWith(overrides: Record<string, unknown>): boolean {
  return buildingBodySchema.safeParse({ ...BUILDING_BODY_EXAMPLE, ...overrides }).success;
}

describe("buildingBodySchema", () => {
  it("accepts the example body", () => {
    expect(buildingBodySchema.parse(BUILDING_BODY_EXAMPLE)).toEqual(BUILDING_BODY_EXAMPLE);
  });

  it("carries an error object every other error response also has", () => {
    const { error } = BUILDING_BODY_EXAMPLE;

    expect(errorBodySchema.safeParse({ error }).success).toBe(true);
  });

  it.each([
    ["another error code", { error: { ...BUILDING_BODY_EXAMPLE.error, code: "not_found" } }],
    ["no hint", { error: { code: "building", message: "A build started." } }],
    ["an id that is not a build id", { build_id: "ep_01jd3k8m4q" }],
    ["a status URL that is not https", { status_url: "builds/bld_01jd3k8m4q" }],
    ["a field that is not part of the body", { eta_s: 40 }],
  ])("rejects %s", (_rule, overrides) => {
    expect(acceptsWith(overrides)).toBe(false);
  });

  it("rejects a body without the build id", () => {
    const { build_id: _removed, ...rest } = BUILDING_BODY_EXAMPLE;

    expect(buildingBodySchema.safeParse(rest).success).toBe(false);
  });
});
