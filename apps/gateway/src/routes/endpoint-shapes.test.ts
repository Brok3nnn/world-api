import { envelopeSchema } from "@repo/contracts/api/envelope";
import { errorBodySchema } from "@repo/contracts/api/error";
import { OUTPUT_SPEC_EXAMPLE } from "@repo/contracts/endpoint/examples/output-spec-example";
import { describe, expect, it } from "vitest";
import { createMemoryEndpointDirectory } from "../adapters/memory/memory-endpoint-directory";
import { createApp } from "../app";
import { servedEndpoint, storedValue, testDeps, valuesWith } from "../testing/test-deps";

/** The test endpoint with a value fetched a minute ago; it can change in 14 minutes. */
function call(query: string, endpoint = servedEndpoint()) {
  const app = createApp(
    testDeps({
      endpoints: createMemoryEndpointDirectory([endpoint]),
      values: valuesWith(storedValue(60)),
    }),
  );
  return app(new Request(`https://api.example.com/@core/weather-now-vienna${query}`));
}

const META = {
  "x-as-of": "2026-11-22T09:58:00.000Z",
  "x-next-refresh": "2026-11-22T10:14:00.000Z",
  "x-price-credits": "1",
  "cache-control": "public, max-age=840",
};

describe("GET /@{owner}/{slug} in every shape", () => {
  it("answers json with the envelope and a public cache lifetime until the next refresh", async () => {
    const response = await call("");

    expect(response.headers.get("content-type")).toMatch(/^application\/json/);
    expect(response.headers.get("cache-control")).toBe("public, max-age=840");
    expect(envelopeSchema.parse(await response.json()).data).toEqual({ temperature_c: 4.2 });
  });

  it.each([
    ["number", "text/plain; charset=utf-8", "4.2"],
    ["text", "text/plain; charset=utf-8", "It is 4.2 °C in Vienna."],
    ["csv", "text/csv; charset=utf-8", "temperature_c\r\n4.2\r\n"],
  ])("answers %s as %s with the metadata headers", async (shape, contentType, body) => {
    const response = await call(`?shape=${shape}`);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(contentType);
    expect(
      Object.fromEntries(Object.keys(META).map((name) => [name, response.headers.get(name)])),
    ).toEqual(META);
    expect(await response.text()).toBe(body);
  });

  it("never lets a shared cache keep a value that is not public", async () => {
    const response = await call("?shape=number", servedEndpoint({ visibility: "unlisted" }));

    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("answers a shape the endpoint cannot produce with 400 and the shapes it supports", async () => {
    const { sentence: _sentence, ...withoutSentence } = OUTPUT_SPEC_EXAMPLE;
    const response = await call("?shape=text", servedEndpoint({ output_spec: withoutSentence }));

    expect(response.status).toBe(400);
    expect(errorBodySchema.parse(await response.json()).error.hint).toBe(
      "This endpoint answers shape=json, number, csv.",
    );
  });

  it("answers a shape the API does not offer with 400 and the shapes it does", async () => {
    const response = await call("?shape=probability");

    expect(response.status).toBe(400);
    expect(errorBodySchema.parse(await response.json()).error).toEqual({
      code: "invalid_request",
      message: "The parameter shape is not valid.",
      hint: "Use shape=json, number, text or csv.",
    });
  });

  it("answers 400 when the value lacks a field the shape needs", async () => {
    const spec = {
      ...OUTPUT_SPEC_EXAMPLE,
      schema: { ...OUTPUT_SPEC_EXAMPLE.schema, required: [] },
    };
    const app = createApp(
      testDeps({
        endpoints: createMemoryEndpointDirectory([servedEndpoint({ output_spec: spec })]),
        values: valuesWith({ ...storedValue(60), data: {} }),
      }),
    );

    const response = await app(
      new Request("https://api.example.com/@core/weather-now-vienna?shape=number"),
    );

    expect(errorBodySchema.parse(await response.json()).error.message).toBe(
      "This value lacks a field the shape needs.",
    );
  });
});
