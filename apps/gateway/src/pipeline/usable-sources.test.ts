import { describe, expect, it } from "vitest";
import { servedEndpoint } from "../testing/test-deps";
import { usableSources } from "./usable-sources";

const NOW = new Date("2026-11-22T10:00:00.000Z");

const [BASE] = servedEndpoint().sources;

function source(hosts: string[], fields: Partial<NonNullable<typeof BASE>> = {}) {
  if (BASE === undefined) {
    throw new Error("The test endpoint has no source.");
  }
  return { ...BASE, hosts, ...fields };
}

describe("usableSources", () => {
  it("keeps the usable sources only", () => {
    const sources = [
      source(["a.example.org", "b.example.org"]),
      source(["b.example.org"]),
      source(["red.example.org"], { tier: "red" }),
      source(["old.example.org"], { policyCheckedAt: new Date("2026-08-01T00:00:00.000Z") }),
    ];

    expect(usableSources(sources, NOW).flatMap((usable) => usable.hosts)).toEqual([
      "a.example.org",
      "b.example.org",
      "b.example.org",
    ]);
  });
});
