import { endpointStatusSchema } from "@repo/contracts/endpoint/endpoint-status";
import { describe, expect, it } from "vitest";
import { canTransition } from "./can-transition";
import { ENDPOINT_TRANSITIONS } from "./endpoint-transitions";

const STATUSES = endpointStatusSchema.options;

/** Every pair of statuses as "from → to", for the pairs the table allows. */
const ALLOWED = [
  "building → live",
  "live → degraded",
  "live → disabled",
  "degraded → live",
  "degraded → disabled",
  "disabled → live",
];

describe("ENDPOINT_TRANSITIONS", () => {
  it("has an entry for every endpoint status", () => {
    expect(Object.keys(ENDPOINT_TRANSITIONS)).toEqual(STATUSES);
  });

  it.each(
    STATUSES.flatMap((from) => STATUSES.map((to) => [from, to] as const)),
  )("allows %s → %s only if the data model lists it", (from, to) => {
    expect(canTransition(ENDPOINT_TRANSITIONS, from, to)).toBe(ALLOWED.includes(`${from} → ${to}`));
  });

  it("lists exactly six transitions", () => {
    expect(Object.values(ENDPOINT_TRANSITIONS).flat()).toHaveLength(ALLOWED.length);
  });
});
