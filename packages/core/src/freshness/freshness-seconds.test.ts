import { freshnessSchema } from "@repo/contracts/endpoint/freshness";
import { describe, expect, it } from "vitest";
import { FRESHNESS_SECONDS } from "./freshness-seconds";

describe("FRESHNESS_SECONDS", () => {
  it("gives every freshness class its interval in seconds", () => {
    expect(FRESHNESS_SECONDS).toEqual({
      "1m": 60,
      "5m": 300,
      "15m": 900,
      "1h": 3600,
      "1d": 86_400,
    });
  });

  it("has an interval for every class of the contract and no other entry", () => {
    expect(Object.keys(FRESHNESS_SECONDS)).toEqual(freshnessSchema.options);
  });
});
