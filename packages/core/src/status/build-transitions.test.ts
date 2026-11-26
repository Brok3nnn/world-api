import { buildStatusSchema } from "@repo/contracts/build/build-status";
import { describe, expect, it } from "vitest";
import { BUILD_TRANSITIONS } from "./build-transitions";
import { canTransition } from "./can-transition";

const STATUSES = buildStatusSchema.options;

const ALLOWED = [
  "queued → running",
  "running → succeeded",
  "running → failed",
  "running → rejected",
];

describe("BUILD_TRANSITIONS", () => {
  it("has an entry for every build status", () => {
    expect(Object.keys(BUILD_TRANSITIONS)).toEqual(STATUSES);
  });

  it.each(
    STATUSES.flatMap((from) => STATUSES.map((to) => [from, to] as const)),
  )("allows %s → %s only if the data model lists it", (from, to) => {
    expect(canTransition(BUILD_TRANSITIONS, from, to)).toBe(ALLOWED.includes(`${from} → ${to}`));
  });

  it.each(["succeeded", "failed", "rejected"] as const)("lets nothing follow %s", (ended) => {
    expect(BUILD_TRANSITIONS[ended]).toEqual([]);
  });
});
