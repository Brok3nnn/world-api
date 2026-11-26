import { errorBodySchema } from "@repo/contracts/api/error";
import { createRecordingLogger } from "@repo/core/log/testing/recording-logger";
import { describe, expect, it } from "vitest";
import { createApp } from "./app";
import type { Route } from "./routes/route";
import { testDeps } from "./testing/test-deps";

const REQUEST_ID = /^req_[0-9a-z]{16}$/;

function call(path: string, init?: RequestInit, routes?: readonly Route[]) {
  const app = createApp(testDeps(), routes);
  return app(new Request(`https://api.example.com${path}`, init));
}

const failing: Route = {
  matches: (pathname) => pathname === "/broken",
  handle: () => {
    throw new Error("defect with a detail the caller must never see");
  },
};

describe("createApp", () => {
  it("answers /healthz with 200 and a request id", async () => {
    const response = await call("/healthz");

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("ok");
    expect(response.headers.get("x-request-id")).toMatch(REQUEST_ID);
  });

  it("gives every call its own request id, whatever the caller sends", async () => {
    const app = createApp(testDeps());

    const first = await app(
      new Request("https://api.example.com/healthz", { headers: { "x-request-id": "mine" } }),
    );
    const second = await app(new Request("https://api.example.com/healthz"));

    expect(first.headers.get("x-request-id")).toMatch(REQUEST_ID);
    expect(first.headers.get("x-request-id")).not.toBe(second.headers.get("x-request-id"));
  });

  it.each([
    ["an unknown path", "/nowhere", "GET"],
    ["a method other than GET", "/healthz", "POST"],
  ])("answers %s with the not_found contract body", async (_case, path, method) => {
    const response = await call(path, { method });
    const body = errorBodySchema.parse(await response.json());

    expect(response.status).toBe(404);
    expect(body.error.code).toBe("not_found");
    expect(body.error.hint).toBeDefined();
    expect(response.headers.get("x-request-id")).toMatch(REQUEST_ID);
  });

  it("turns a route that throws into internal_error, without a hint or the defect's detail", async () => {
    const response = await call("/broken", undefined, [failing]);
    const text = await response.text();

    expect(response.status).toBe(500);
    expect(errorBodySchema.parse(JSON.parse(text))).toEqual({
      error: { code: "internal_error", message: "Something went wrong on our side." },
    });
    expect(text).not.toContain("defect");
    expect(response.headers.get("x-request-id")).toMatch(REQUEST_ID);
  });

  it("logs a defect as one error event with the path and never the query", async () => {
    const logger = createRecordingLogger();
    const app = createApp(testDeps({ logger }), [failing]);

    const response = await app(new Request("https://api.example.com/broken?secret=value-marker"));

    expect(logger.entries).toEqual([
      {
        level: "error",
        event: "call.defect",
        fields: {
          request_id: response.headers.get("x-request-id"),
          path: "/broken",
          error: "Error",
        },
      },
    ]);
    expect(JSON.stringify(logger.entries)).not.toContain("value-marker");
  });

  it("logs a thrown value that is not an error as an unknown defect", async () => {
    const logger = createRecordingLogger();
    const throwsText: Route = {
      matches: () => true,
      handle: () => Promise.reject("text"),
    };
    const app = createApp(testDeps({ logger }), [throwsText]);

    expect((await app(new Request("https://api.example.com/x"))).status).toBe(500);
    expect(logger.entries[0]?.fields.error).toBe("unknown");
  });
});
