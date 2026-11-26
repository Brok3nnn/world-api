import { createFakeClock } from "@repo/core/time/testing/fake-clock";
import { describe, expect, it } from "vitest";
import { FRANKFURT_REPORT_FILE } from "../golden/frankfurt-report-file";
import { RECORDED_AT } from "../golden/golden-recipe";
import INDEX from "../golden/recordings/dwd-station-report-index.json" with { type: "json" };
import OBSERVATION from "../golden/recordings/topeka-latest-observation.json" with { type: "json" };
import { TOPEKA_WEATHER } from "../golden/topeka-weather";
import { createFakeHttpClient, type FakeHttpAnswer } from "../ports/testing/fake-http-client";
import { createFakeResolveHost } from "../ports/testing/fake-resolve-host";
import { createFakeWait } from "../ports/testing/fake-wait";
import { exitCodeOf, PROOF_EXIT, proveRecipes } from "./prove-recipes";
import { renderProofReport } from "./render-proof-report";

const RECIPES = [TOPEKA_WEATHER, FRANKFURT_REPORT_FILE];

/** Live sources played by fakes, answering as they did when the recordings were made. */
function prove(overrides: Record<string, FakeHttpAnswer> = {}) {
  const answers: Record<string, FakeHttpAnswer> = {};
  for (const { url, status, contentType, body } of [OBSERVATION, INDEX]) {
    answers[url] = { status, contentType, body };
  }
  const client = createFakeHttpClient({ ...answers, ...overrides });
  const egress = {
    http: client.http,
    resolveHost: createFakeResolveHost({
      "api.weather.gov": ["23.4.5.6"],
      "opendata.dwd.de": ["141.38.2.26"],
    }),
    wait: createFakeWait().wait,
    userAgent: "recipe-engine/1 (+contact-marker@example.com)",
    rateLimit: () => true,
  };
  return proveRecipes(RECIPES, egress, createFakeClock(new Date(RECORDED_AT)));
}

function report(evidences: Awaited<ReturnType<typeof prove>>): string {
  const passed = exitCodeOf(evidences, RECIPES.length) === PROOF_EXIT.pass;
  return renderProofReport({ evidences, commit: "abc1234", ranAt: new Date(RECORDED_AT), passed });
}

describe("proveRecipes", () => {
  it("passes when every recipe yields a value its output spec accepts", async () => {
    const evidences = await prove();

    expect(evidences.map((evidence) => evidence.verdict)).toEqual(["pass", "pass"]);
    expect(exitCodeOf(evidences, RECIPES.length)).toBe(PROOF_EXIT.pass);
  });

  it("reports the recipes, their traces and values, and never the user agent", async () => {
    const text = report(await prove());

    expect(text).toContain("| Verdict | **PASS** |");
    expect(text).toContain("| `observation` | `http.get` | 0 ms | 4332 | ok |");
    expect(text).toContain('"temperature_c": 9');
    expect(text).toContain("As of 2026-11-22T20:20:00.000Z.");
    expect(text).not.toContain("contact-marker");
  });

  it("says which source is unreachable, exits with its own code and runs nothing after it", async () => {
    const evidences = await prove({ [OBSERVATION.url]: "unreachable" });

    expect(evidences.map((evidence) => [evidence.verdict, evidence.reason])).toEqual([
      ["unreachable", "api.weather.gov is unreachable (fetch_failed at step observation)."],
    ]);
    expect(exitCodeOf(evidences, RECIPES.length)).toBe(PROOF_EXIT.unreachable);
    expect(report(evidences)).toContain("| Verdict | **FAIL** |");
  });

  it("fails when a live value breaks its output spec, naming the rule", async () => {
    const hot = OBSERVATION.body.replace('"value": 9,', '"value": 99,');
    const evidences = await prove({ [OBSERVATION.url]: { status: 200, body: hot } });

    expect(evidences[0]?.violations).toEqual([{ path: "/temperature_c", rule: "maximum" }]);
    expect(exitCodeOf(evidences, RECIPES.length)).toBe(PROOF_EXIT.failed);
    expect(report(evidences)).toContain("Output firewall violations:");
  });

  it("fails a run that stops at a step for another reason", async () => {
    const evidences = await prove({
      [INDEX.url]: { status: 200, contentType: "text/html", body: "<p>moved</p>" },
    });

    expect(evidences[1]?.reason).toBe("The run failed with selector_empty at step file.");
    expect(exitCodeOf(evidences, RECIPES.length)).toBe(PROOF_EXIT.failed);
  });

  it("fails when fewer recipes ran than were expected", () => {
    expect(exitCodeOf([], RECIPES.length)).toBe(PROOF_EXIT.failed);
  });
});
