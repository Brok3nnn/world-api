import { err, ok } from "@repo/core/result";
import type { Clock } from "@repo/core/time/clock";
import { createFakeClock } from "@repo/core/time/testing/fake-clock";
import { describe, expect, it } from "vitest";
import type { JsonValue } from "../engine/json-value";
import { evaluateExpression } from "./evaluate-expression";

const INPUT = {
  forecast: { current: { temperature: 21.5, time: "2026-11-22T10:00:00Z" } },
  rate: { rate: 401.2 },
  stations: [
    { name: "Upper", level_cm: 182 },
    { name: "Lower", level_cm: 201 },
  ],
};

const STOPPED = createFakeClock(new Date("2026-11-22T10:00:00Z"));

/** A clock that moves one millisecond every time it is read, as a busy evaluation would see. */
function tickingClock(): Clock {
  let now = Date.parse("2026-11-22T10:00:00Z");
  return {
    now: () => {
      now += 1;
      return new Date(now);
    },
  };
}

function evaluate(expr: string, clock: Clock = STOPPED) {
  return evaluateExpression(expr, INPUT, clock);
}

describe("evaluateExpression", () => {
  it.each([
    ["reads nested fields", "forecast.current.temperature", 21.5],
    ["maps over an array", "stations.level_cm", [182, 201]],
    ["maps with a function", "$map(stations, function($s) { $s.level_cm / 100 })", [1.82, 2.01]],
    ["does arithmetic", "$round(rate.rate * 2 - 2.4, 1)", 800],
    ["filters and aggregates", "$sum(stations[level_cm > 190].level_cm)", 201],
    [
      "builds objects",
      '{ "temperature_c": forecast.current.temperature, "eur_huf": rate.rate }',
      { temperature_c: 21.5, eur_huf: 401.2 },
    ],
  ] satisfies [string, string, JsonValue][])("%s", async (_case, expr, value) => {
    expect(await evaluate(expr)).toEqual(ok(value));
  });

  it("returns plain JSON, not the library's own sequences", async () => {
    const evaluated = await evaluate("stations.name");

    expect(evaluated.ok && Object.keys(evaluated.value ?? {})).toEqual(["0", "1"]);
  });

  it("stops recursion without end at the depth limit", async () => {
    expect(await evaluate("($f := function($x) { 1 + $f($x + 1) }; $f(0))")).toEqual(
      err({ code: "limit_exceeded" }),
    );
  });

  it("stops a tail call without end, which does not nest, at the time limit", async () => {
    // The library runs tail calls in a loop, so only the clock can end this one.
    expect(await evaluate("($f := function($x) { $f($x + 1) }; $f(0))", tickingClock())).toEqual(
      err({ code: "limit_exceeded" }),
    );
  });

  it("stops a long evaluation once the clock passes the time limit", async () => {
    expect(await evaluate("$map([1..5000], function($x) { $x * 2 })", tickingClock())).toEqual(
      err({ code: "limit_exceeded" }),
    );
  });

  it.each([
    ["the clock through $now", "$now()"],
    ["the clock through $millis", "$millis()"],
    ["randomness", "$random()"],
    ["randomness through $shuffle", "$shuffle([1, 2, 3])"],
    ["text run as code", '$eval("1 + 1")'],
    ["a global of the runtime", "$globalThis"],
    ["a regular expression literal", '$match("aaa", /a+/)'],
  ])("cannot reach %s", async (_case, expr) => {
    expect(await evaluate(expr)).toEqual(err({ code: "expression_failed" }));
  });

  it.each([
    ["does not parse", "forecast.("],
    ["yields nothing", "forecast.missing"],
    ["yields a function", "function($x) { $x }"],
    ["fails while evaluating", '"text" + 1'],
  ])("fails with expression_failed when the expression %s", async (_case, expr) => {
    expect(await evaluate(expr)).toEqual(err({ code: "expression_failed" }));
  });
});
