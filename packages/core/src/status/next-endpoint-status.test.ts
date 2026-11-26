import { describe, expect, it } from "vitest";
import { canTransition } from "./can-transition";
import { ENDPOINT_TRANSITIONS } from "./endpoint-transitions";
import { FAILURES_BEFORE_DEGRADED, nextEndpointStatus } from "./next-endpoint-status";

describe("nextEndpointStatus", () => {
  it("degrades at the third failure in a row", () => {
    expect(FAILURES_BEFORE_DEGRADED).toBe(3);
  });

  it("keeps a live endpoint live after a success", () => {
    expect(nextEndpointStatus("live", "success", 0)).toBe("live");
  });

  it.each([1, 2])("keeps a live endpoint live after failure number %i", (failures) => {
    expect(nextEndpointStatus("live", "failure", failures)).toBe("live");
  });

  it("degrades a live endpoint at the third consecutive failure", () => {
    expect(nextEndpointStatus("live", "failure", 3)).toBe("degraded");
  });

  it("keeps a degraded endpoint degraded while failures continue", () => {
    expect(nextEndpointStatus("degraded", "failure", 4)).toBe("degraded");
  });

  it("restores a degraded endpoint on the next success", () => {
    expect(nextEndpointStatus("degraded", "success", 0)).toBe("live");
  });

  it.each(["building", "disabled"] as const)("never changes a %s endpoint", (status) => {
    expect(nextEndpointStatus(status, "success", 0)).toBe(status);
    expect(nextEndpointStatus(status, "failure", 9)).toBe(status);
  });

  it("only ever makes a move the transition table allows", () => {
    const degraded = nextEndpointStatus("live", "failure", 3);
    const restored = nextEndpointStatus("degraded", "success", 0);

    expect(canTransition(ENDPOINT_TRANSITIONS, "live", degraded)).toBe(true);
    expect(canTransition(ENDPOINT_TRANSITIONS, "degraded", restored)).toBe(true);
  });
});
