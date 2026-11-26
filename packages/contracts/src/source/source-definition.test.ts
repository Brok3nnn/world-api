import { describe, expect, it } from "vitest";
import { SOURCE_EXAMPLE } from "./examples/source-example";
import { sourceCapabilitiesSchema } from "./source-capabilities";
import { sourceDefinitionSchema } from "./source-definition";

const OFFERING = SOURCE_EXAMPLE.capabilities.offerings[0];

function issuesWith(overrides: Record<string, unknown>): string[] {
  const parsed = sourceDefinitionSchema.safeParse({ ...SOURCE_EXAMPLE, ...overrides });
  return (parsed.error?.issues ?? []).map((issue) => `${issue.path.join(".")}: ${issue.message}`);
}

function offeringIssues(overrides: Record<string, unknown>): boolean {
  return !sourceCapabilitiesSchema.safeParse({ offerings: [{ ...OFFERING, ...overrides }] })
    .success;
}

describe("sourceDefinitionSchema", () => {
  it("accepts the example source", () => {
    expect(sourceDefinitionSchema.parse(SOURCE_EXAMPLE)).toEqual(SOURCE_EXAMPLE);
  });

  it("accepts a source whose licence requires no attribution", () => {
    expect(issuesWith({ attribution: null })).toEqual([]);
  });

  it("names a sample that is not on one of the source's hosts", () => {
    const offering = { ...OFFERING, sample_url: "https://elsewhere.example.com/v1" };

    expect(issuesWith({ capabilities: { offerings: [offering] } })).toEqual([
      "capabilities.offerings.0.sample_url: The sample is on elsewhere.example.com, which is not one of the source's hosts.",
    ]);
  });

  it.each([
    ["no hosts", { hosts: [] }],
    ["a host with a scheme", { hosts: ["https://api.example.org"] }],
    ["a host with a path", { hosts: ["api.example.org/v1"] }],
    ["an uppercase host", { hosts: ["API.example.org"] }],
    ["documentation that is not https", { docs_url: "http://example.org/docs" }],
    ["evidence that is not https", { evidence_url: "ftp://example.org/terms" }],
    ["an empty licence", { licence: "" }],
    ["a licence longer than a name", { licence: "a".repeat(81) }],
    ["an empty attribution", { attribution: "" }],
    ["no attribution at all", { attribution: undefined }],
    ["empty terms", { terms: "" }],
    ["an unknown tier", { tier: "amber" }],
    ["a check time with an offset", { policy_checked_at: "2026-11-21T11:00:00+01:00" }],
    ["a rate limit of zero", { rate_limit_per_min: 0 }],
    ["no offerings", { capabilities: { offerings: [] } }],
    ["a field that is not part of a source", { owner: "core" }],
  ])("rejects %s", (_rule, overrides) => {
    expect(issuesWith(overrides)).not.toEqual([]);
  });
});

describe("sourceCapabilitiesSchema", () => {
  it.each([
    ["an empty name", { name: "" }],
    ["no keywords", { keywords: [] }],
    ["an uppercase keyword", { keywords: ["Weather"] }],
    ["a sample that is not https", { sample_url: "http://api.example.org/v1" }],
    ["an unknown format", { format: "xml" }],
    ["a field that is not part of an offering", { price: 1 }],
  ])("rejects an offering with %s", (_rule, overrides) => {
    expect(offeringIssues(overrides)).toBe(true);
  });
});
