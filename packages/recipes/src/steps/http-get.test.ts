import { err, ok } from "@repo/core/result";
import { createFakeClock } from "@repo/core/time/testing/fake-clock";
import { describe, expect, it } from "vitest";
import type { StepContext, StepOf } from "../engine/step-executor";
import type { SourceFetch, SourceFetchFailure, SourceRequest } from "../ports/source-fetch";
import { createFakeEndpointReader } from "../ports/testing/fake-endpoint-reader";
import { createFakeSourceFetch } from "../ports/testing/fake-source-fetch";
import { httpGet } from "./http-get";

const SOURCE_URL = "https://api.example.org/v1/now";

function contextFor(fetch: SourceFetch): StepContext {
  return {
    results: new Map(),
    deps: {
      fetch,
      readEndpoint: createFakeEndpointReader({}),
      clock: createFakeClock(new Date("2026-11-22T10:00:00Z")),
    },
  };
}

function answering(status: number, contentType: string | null, body: string): StepContext {
  return contextFor(
    createFakeSourceFetch({ [SOURCE_URL]: { status, contentType, body, bytes: body.length } }),
  );
}

function step(expect: StepOf<"http.get">["expect"]): StepOf<"http.get"> {
  return { id: "source", use: "http.get", url: SOURCE_URL, expect };
}

describe("httpGet", () => {
  it.each([
    ["application/json", '{"now":{"t":21.5,"tags":["a"]}}', { now: { t: 21.5, tags: ["a"] } }],
    ["application/geo+json", "[1,2]", [1, 2]],
    [null, "true", true],
    ["text/plain", "21.5", 21.5],
  ])("parses a JSON body sent as %j", async (contentType, body, value) => {
    expect(await httpGet(step("json"), answering(200, contentType, body))).toEqual(
      ok({ value, bytes: body.length }),
    );
  });

  it.each([
    ["text", "text/csv", "a;b\n1;2"],
    ["text", "application/xml", "<t>21.5</t>"],
    ["html", "text/html", "<p>21.5</p>"],
    ["html", "application/octet-stream", "<p>21.5</p>"],
  ] as const)("keeps a %s body sent as %s as text", async (format, contentType, body) => {
    expect(await httpGet(step(format), answering(204, contentType, body))).toEqual(
      ok({ value: body, bytes: body.length }),
    );
  });

  it.each([
    ["json", "text/html", '{"t":1}'],
    ["json", "application/json", "{not json"],
    ["text", "image/png", "PNG"],
    ["html", "application/json", "{}"],
    ["csv", "text/html", "a,b\n1,2"],
    ["csv", "text/csv", "a,b\n1,2,3"],
  ] as const)("refuses a %s step's body sent as %s", async (format, contentType, body) => {
    expect(await httpGet(step(format), answering(200, contentType, body))).toEqual(
      err({ code: "unexpected_content" }),
    );
  });

  it.each([
    ["text/csv", "name,t\nVienna,21.5\n"],
    ["text/plain", "name;t\r\nVienna;21,5"],
  ])("reads a CSV body sent as %s into records", async (contentType, body) => {
    const read = await httpGet(step("csv"), answering(200, contentType, body));
    expect(read.ok && read.value.value).toEqual([
      { name: "Vienna", t: expect.stringMatching(/^21[.,]5$/) },
    ]);
  });

  it.each([404, 500, 302, 199])("fails on status %i", async (status) => {
    expect(await httpGet(step("text"), answering(status, "text/plain", "x"))).toEqual(
      err({ code: "fetch_failed" }),
    );
  });

  it.each([
    "policy_denied",
    "fetch_failed",
    "fetch_timeout",
    "too_large",
  ] satisfies SourceFetchFailure["code"][])("passes on %s from the policed fetch", async (code) => {
    const context = contextFor(createFakeSourceFetch({ [SOURCE_URL]: code }));
    expect(await httpGet(step("json"), context)).toEqual(err({ code }));
  });

  it("asks for the URL with only the headers the step sets", async () => {
    const requests: SourceRequest[] = [];
    const recording: SourceFetch = async (request) => {
      requests.push(request);
      return err({ code: "fetch_failed" });
    };
    const withHeaders = { ...step("json"), headers: { "accept-language": "de" } };
    await httpGet(withHeaders, contextFor(recording));
    await httpGet(step("json"), contextFor(recording));
    expect(requests).toEqual([
      { url: SOURCE_URL, headers: { "accept-language": "de" } },
      { url: SOURCE_URL, headers: {} },
    ]);
  });
});
