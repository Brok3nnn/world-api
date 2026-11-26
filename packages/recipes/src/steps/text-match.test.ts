import { err, ok } from "@repo/core/result";
import { createFakeClock } from "@repo/core/time/testing/fake-clock";
import { describe, expect, it } from "vitest";
import type { JsonValue } from "../engine/json-value";
import { RUN_LIMITS } from "../engine/run-limits";
import type { StepContext, StepOf } from "../engine/step-executor";
import { createFakeEndpointReader } from "../ports/testing/fake-endpoint-reader";
import { createFakeSourceFetch } from "../ports/testing/fake-source-fetch";
import { textMatch } from "./text-match";

const REPORT = "Station Upper\nLevel: 182 cm (rising)\nUpdated 2026-11-22 09:45 UTC";

function withText(text: JsonValue): StepContext {
  return {
    results: new Map([["report", text]]),
    deps: {
      fetch: createFakeSourceFetch({}),
      readEndpoint: createFakeEndpointReader({}),
      clock: createFakeClock(new Date("2026-11-22T10:00:00Z")),
    },
  };
}

function step(pattern: string, flags?: string): StepOf<"text.match"> {
  return {
    id: "found",
    use: "text.match",
    from: "report",
    pattern,
    ...(flags === undefined ? {} : { flags }),
  };
}

describe("textMatch", () => {
  it.each([
    ["named groups by name", "Level: (?P<level>\\d+) (?P<unit>\\w+)", { level: "182", unit: "cm" }],
    ["the other way to name a group", "Level: (?<level>\\d+)", { level: "182" }],
    ["numbered groups in order", "Updated (\\d{4})-(\\d{2})-(\\d{2})", ["2026", "11", "22"]],
    ["the whole match when there are no groups", "\\d+ cm", "182 cm"],
    ["null for a group that did not take part", "Level: (\\d+) (mm)?", ["182", null]],
  ] satisfies [string, string, JsonValue][])("returns %s", async (_case, pattern, value) => {
    expect(await textMatch(step(pattern), withText(REPORT))).toEqual(ok({ value }));
  });

  it.each([
    ["i", "level: (\\d+)", ["182"]],
    ["m", "^Level: (\\d+)$", null],
    ["m", "^Level: (\\d+) cm \\(rising\\)$", ["182"]],
    ["s", "Upper.Level: (\\d+)", ["182"]],
    ["u", "(\\d+) cm", ["182"]],
  ])("applies the flag %s", async (flags, pattern, value) => {
    const matched = await textMatch(step(pattern, flags), withText(REPORT));

    expect(matched.ok ? matched.value.value : null).toEqual(value);
  });

  it.each([
    ["nothing matches", "Pressure: (\\d+)"],
    ["the pattern does not parse", "Level: (\\d+"],
    ["the pattern needs a back-reference", "(\\w)\\1"],
    ["the pattern needs a lookahead", "\\d+(?= cm)"],
  ])("fails with pattern_no_match when %s", async (_case, pattern) => {
    expect(await textMatch(step(pattern), withText(REPORT))).toEqual(
      err({ code: "pattern_no_match" }),
    );
  });

  it("finishes a pattern that is catastrophic for a backtracking engine", async () => {
    const hostile = `${"a".repeat(50_000)}!`;

    expect(await textMatch(step("^(a+)+$"), withText(hostile))).toEqual(
      err({ code: "pattern_no_match" }),
    );
  });

  it("refuses text longer than one fetch may return", async () => {
    const long = "a".repeat(RUN_LIMITS.matchInputChars + 1);

    expect(await textMatch(step("a"), withText(long))).toEqual(err({ code: "limit_exceeded" }));
  });

  it.each([{ text: REPORT }, 182, null])("fails with unexpected_content for %j", async (result) => {
    expect(await textMatch(step("\\d+"), withText(result))).toEqual(
      err({ code: "unexpected_content" }),
    );
  });
});
