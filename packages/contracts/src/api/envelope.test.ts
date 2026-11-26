import { describe, expect, it } from "vitest";
import { type Envelope, envelopeSchema } from "./envelope";
import { ENVELOPE_EXAMPLE } from "./examples/envelope-example";

/** The example with some fields replaced, as untyped input the way a response arrives. */
function envelopeWith(overrides: Record<string, unknown>): Record<string, unknown> {
  return { ...ENVELOPE_EXAMPLE, ...overrides };
}

const [SOURCE] = ENVELOPE_EXAMPLE.sources;

function accepts(input: unknown): boolean {
  return envelopeSchema.safeParse(input).success;
}

describe("envelopeSchema", () => {
  it("accepts the example of the API reference unchanged", () => {
    expect(envelopeSchema.parse(ENVELOPE_EXAMPLE)).toEqual(ENVELOPE_EXAMPLE);
  });

  it("accepts nested objects, arrays and null inside data", () => {
    expect(accepts(envelopeWith({ data: { rows: [{ a: 1 }, { a: null }], ok: true } }))).toBe(true);
  });

  it("accepts an instant with fractional seconds", () => {
    expect(accepts(envelopeWith({ as_of: "2026-11-21T11:49:10.250Z" }))).toBe(true);
  });

  it("accepts a price of zero credits", () => {
    expect(accepts(envelopeWith({ price_credits: 0 }))).toBe(true);
  });

  it("accepts several sources, one of them under a licence that requires no attribution", () => {
    const sources = [...ENVELOPE_EXAMPLE.sources, { ...SOURCE, attribution: null }];

    expect(accepts(envelopeWith({ sources }))).toBe(true);
  });

  // Safe: Object.keys returns exactly the keys of this constant object, typed as string[].
  it.each(
    Object.keys(ENVELOPE_EXAMPLE) as (keyof Envelope)[],
  )("rejects an envelope without %s", (field) => {
    const { [field]: _removed, ...rest } = ENVELOPE_EXAMPLE;

    expect(accepts(rest)).toBe(false);
  });

  it("rejects a field that is not part of the envelope", () => {
    expect(accepts(envelopeWith({ debug: true }))).toBe(false);
  });

  it.each([
    ["an array", [1, 2]],
    ["text", "7"],
    ["null", null],
  ])("rejects data that is %s", (_kind, data) => {
    expect(accepts(envelopeWith({ data }))).toBe(false);
  });

  it.each(["as_of", "next_refresh"])("rejects %s with a time zone offset", (field) => {
    expect(accepts(envelopeWith({ [field]: "2026-11-21T12:49:10+01:00" }))).toBe(false);
  });

  it.each(["as_of", "next_refresh"])("rejects %s without a time", (field) => {
    expect(accepts(envelopeWith({ [field]: "2026-11-21" }))).toBe(false);
  });

  it("rejects an empty list of sources", () => {
    expect(accepts(envelopeWith({ sources: [] }))).toBe(false);
  });

  it.each([
    ["given as plain text", "Example open weather service"],
    ["with an empty name", { ...SOURCE, name: "" }],
    ["with a URL that is not https", { ...SOURCE, url: "http://example.org/docs" }],
    ["with an empty licence", { ...SOURCE, licence: "" }],
    ["with an empty attribution", { ...SOURCE, attribution: "" }],
    ["without an attribution", { name: SOURCE.name, url: SOURCE.url, licence: SOURCE.licence }],
    ["with the registry's review notes", { ...SOURCE, terms: "Checked on 2026-11-22." }],
  ])("rejects a source %s", (_rule, source) => {
    expect(accepts(envelopeWith({ sources: [source] }))).toBe(false);
  });

  it("rejects a method that is not listed", () => {
    expect(accepts(envelopeWith({ method: "guessed" }))).toBe(false);
  });

  it.each([
    ["negative", -1],
    ["fractional", 1.5],
    ["text", "4"],
  ])("rejects a %s price", (_kind, price_credits) => {
    expect(accepts(envelopeWith({ price_credits }))).toBe(false);
  });
});
