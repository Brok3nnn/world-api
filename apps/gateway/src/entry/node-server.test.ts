import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";
import { createApp } from "../app";
import { testDeps } from "../testing/test-deps";
import { serveNode } from "./node-server";

/** The URLs of a search page, whatever their scheme: a local server is plain HTTP. */
const URLS = z.object({ items: z.array(z.object({ url: z.string() })) });

let server: Server;
let base = "";

beforeAll(async () => {
  server = await serveNode(createApp(testDeps()), 0);
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("The gateway is not listening on a TCP port.");
  }
  base = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe("serveNode", () => {
  it("serves /healthz from an in-process server, with its request id", async () => {
    const response = await fetch(`${base}/healthz`);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("ok");
    expect(response.headers.get("x-request-id")).toMatch(/^req_[0-9a-z]{16}$/);
  });

  it.each([
    ["the origin the caller used", {}, (port: number) => `http://127.0.0.1:${port}`],
    [
      "https when a proxy ended TLS",
      { "x-forwarded-proto": "https, http" },
      (port: number) => `https://127.0.0.1:${port}`,
    ],
  ])("builds permanent URLs on %s", async (_case, headers, origin) => {
    const response = await fetch(`${base}/search?q=weather`, { headers });
    const page = URLS.parse(await response.json());

    expect(page.items.map((item) => item.url)).toEqual([
      `${origin(Number(new URL(base).port))}/@core/weather-now-vienna`,
    ]);
  });

  it("passes the method and the path through, so other routes get their contract errors", async () => {
    const response = await fetch(`${base}/nowhere?x=1`, { method: "POST", body: "ignored" });

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ error: { code: "not_found" } });
  });
});
