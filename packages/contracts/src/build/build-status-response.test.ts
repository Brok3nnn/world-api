import { describe, expect, it } from "vitest";
import { buildStatusResponseSchema } from "./build-status-response";
import { BUILD_STATUS_RESPONSE_EXAMPLE } from "./examples/build-examples";

function acceptsWith(overrides: Record<string, unknown>): boolean {
  return buildStatusResponseSchema.safeParse({ ...BUILD_STATUS_RESPONSE_EXAMPLE, ...overrides })
    .success;
}

describe("buildStatusResponseSchema", () => {
  it("accepts the example of the API reference", () => {
    expect(buildStatusResponseSchema.parse(BUILD_STATUS_RESPONSE_EXAMPLE)).toEqual(
      BUILD_STATUS_RESPONSE_EXAMPLE,
    );
  });

  it("accepts a succeeded build with its endpoint", () => {
    const endpoint = "https://api.example.com/@rooftop_lab/main-street-parking";

    expect(acceptsWith({ status: "succeeded", stage: null, progress: 1, endpoint })).toBe(true);
  });

  it("accepts a rejected build with its reason", () => {
    const reason = "No permitted source offers this.";

    expect(acceptsWith({ status: "rejected", stage: null, progress: 1, reason })).toBe(true);
  });

  it.each([
    ["an id that is not a build id", { id: "ep_01jd3k8m4q" }],
    ["an unknown status", { status: "cancelled" }],
    ["an unknown stage", { stage: "repair" }],
    ["progress below 0", { progress: -0.1 }],
    ["progress above 1", { progress: 1.01 }],
    ["an endpoint that is not an https URL", { endpoint: "/@core/weather" }],
    ["an empty reason", { reason: "" }],
    ["a field that is not part of the response", { eta_s: 30 }],
  ])("rejects %s", (_rule, overrides) => {
    expect(acceptsWith(overrides)).toBe(false);
  });

  it.each(["stage", "endpoint", "reason"] as const)("rejects a response without %s", (field) => {
    const { [field]: _removed, ...rest } = BUILD_STATUS_RESPONSE_EXAMPLE;

    expect(buildStatusResponseSchema.safeParse(rest).success).toBe(false);
  });
});
