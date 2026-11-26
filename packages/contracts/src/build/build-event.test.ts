import { describe, expect, it } from "vitest";
import { buildEventSchema } from "./build-event";
import { BUILD_EVENT_EXAMPLE } from "./examples/build-report-examples";

function acceptsWith(overrides: Record<string, unknown>): boolean {
  return buildEventSchema.safeParse({ ...BUILD_EVENT_EXAMPLE, ...overrides }).success;
}

describe("buildEventSchema", () => {
  it("accepts the example event", () => {
    expect(buildEventSchema.parse(BUILD_EVENT_EXAMPLE)).toEqual(BUILD_EVENT_EXAMPLE);
  });

  it("accepts an event without detail", () => {
    expect(acceptsWith({ detail: undefined })).toBe(true);
  });

  it.each(["started", "progress", "completed", "failed"])("accepts the kind %s", (kind) => {
    expect(acceptsWith({ kind })).toBe(true);
  });

  it.each([
    ["an id that is not a build id", { build_id: "ep_01jd3k8m4q" }],
    ["an unknown stage", { stage: "repair" }],
    ["an unknown kind", { kind: "retried" }],
    ["an empty message", { message: "" }],
    ["a message of 301 characters", { message: "a".repeat(301) }],
    ["detail that is not an object", { detail: "12 of 20" }],
    ["an instant with an offset", { at: "2026-11-21T12:49:10+01:00" }],
    ["a field that is not part of an event", { level: "info" }],
  ])("rejects %s", (_rule, overrides) => {
    expect(acceptsWith(overrides)).toBe(false);
  });
});
