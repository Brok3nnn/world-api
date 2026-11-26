import { err, ok } from "@repo/core/result";
import { describe, expect, it } from "vitest";
import { RUN_LIMITS } from "../engine/run-limits";
import type { SourceRequest } from "../ports/source-fetch";
import { createFakeHttpClient, type FakeHttpAnswer } from "../ports/testing/fake-http-client";
import { createFakeResolveHost } from "../ports/testing/fake-resolve-host";
import { createFakeWait } from "../ports/testing/fake-wait";
import { createPolicedFetch } from "./create-policed-fetch";

const USER_AGENT = "data-engine-test/1 (+https://example.com/contact)";
const API = "https://api.example.org";
const CDN = "https://cdn.example.org";

function policed(
  answers: Readonly<Record<string, FakeHttpAnswer>>,
  rateLimit = (_host: string) => true,
) {
  const client = createFakeHttpClient(answers);
  const timer = createFakeWait();
  const fetch = createPolicedFetch({
    http: client.http,
    resolveHost: createFakeResolveHost({
      "api.example.org": ["93.184.216.34"],
      "cdn.example.org": ["93.184.216.35", "2606:2800:220:1::35"],
      "inside.example.org": ["10.0.0.1"],
    }),
    wait: timer.wait,
    userAgent: USER_AGENT,
    allowedHosts: ["api.example.org", "cdn.example.org", "inside.example.org", "gone.example.org"],
    rateLimit,
  });
  return { fetch, client, timer };
}

function get(url: string): SourceRequest {
  return { url, headers: { accept: "application/json" } };
}

describe("createPolicedFetch", () => {
  it("sends one GET to an approved address with the user agent and returns the decoded body", async () => {
    const { fetch, client, timer } = policed({
      [`${API}/v1`]: {
        status: 200,
        contentType: "Application/JSON; charset=utf-8",
        body: '{"t":21.5}',
      },
    });
    expect(await fetch(get(`${API}/v1`))).toEqual(
      ok({ status: 200, contentType: "application/json", body: '{"t":21.5}', bytes: 10 }),
    );
    expect(client.requests.map(({ url, address, headers }) => ({ url, address, headers }))).toEqual(
      [
        {
          url: `${API}/v1`,
          address: "93.184.216.34",
          headers: { accept: "application/json", "user-agent": USER_AGENT },
        },
      ],
    );
    expect(timer.signals[0]?.aborted).toBe(true);
  });

  it("returns a response outside 200–299 as it is, for the step to judge", async () => {
    const { fetch } = policed({ [`${API}/missing`]: { status: 404, body: "gone" } });
    expect(await fetch(get(`${API}/missing`))).toEqual(
      ok({ status: 404, contentType: null, body: "gone", bytes: 4 }),
    );
  });

  it.each([
    ["http://api.example.org/v1", "policy_denied"],
    ["https://other.example.org/v1", "policy_denied"],
    ["https://inside.example.org/v1", "policy_denied"],
    ["https://gone.example.org/v1", "fetch_failed"],
  ])("refuses %s as %s before any request is sent", async (url, code) => {
    const { fetch, client } = policed({});
    const fetched = await fetch(get(url));
    expect(fetched.ok ? "sent" : fetched.error.code).toBe(code);
    expect(client.requests).toEqual([]);
  });

  it("follows two redirects, checking every hop, relative locations included", async () => {
    const { fetch, client } = policed({
      [`${API}/a`]: { status: 301, location: "/b" },
      [`${API}/b`]: { status: 307, location: `${CDN}/c` },
      [`${CDN}/c`]: { status: 200, body: "21.5" },
    });
    expect(await fetch(get(`${API}/a`))).toEqual(
      ok({ status: 200, contentType: null, body: "21.5", bytes: 4 }),
    );
    expect(client.requests.map(({ url, address }) => [url, address])).toEqual([
      [`${API}/a`, "93.184.216.34"],
      [`${API}/b`, "93.184.216.34"],
      [`${CDN}/c`, "93.184.216.35"],
    ]);
  });

  it("refuses a redirect to a host that is not on the list", async () => {
    const { fetch, client } = policed({
      [`${API}/a`]: { status: 302, location: "https://elsewhere.example.net/x" },
    });
    expect(await fetch(get(`${API}/a`))).toEqual(
      err({ code: "policy_denied", reason: "host_not_allowed" }),
    );
    expect(client.requests).toHaveLength(1);
  });

  it.each([
    [
      "a redirect loop",
      {
        [`${API}/a`]: { status: 302, location: `${API}/b` },
        [`${API}/b`]: { status: 302, location: `${API}/a` },
      },
    ],
    [
      "a third redirect",
      {
        [`${API}/a`]: { status: 302, location: `${API}/b` },
        [`${API}/b`]: { status: 302, location: `${API}/c` },
        [`${API}/c`]: { status: 302, location: `${API}/d` },
      },
    ],
    ["a redirect without a location", { [`${API}/a`]: { status: 303 } }],
    ["a connection that fails", { [`${API}/a`]: "unreachable" }],
  ] satisfies [string, Record<string, FakeHttpAnswer>][])("fails on %s", async (_case, answers) => {
    const { fetch, client } = policed(answers);
    expect(await fetch(get(`${API}/a`))).toEqual(err({ code: "fetch_failed" }));
    expect(client.requests.length).toBeLessThanOrEqual(RUN_LIMITS.redirects + 1);
  });

  it("gives up on a source that does not answer when the deadline passes", async () => {
    const { fetch, client, timer } = policed({ [`${API}/slow`]: "stalled" });
    const fetching = fetch(get(`${API}/slow`));
    await Promise.resolve();
    timer.expire();
    expect(await fetching).toEqual(err({ code: "fetch_timeout" }));
    expect(timer.started).toEqual([RUN_LIMITS.stepMs]);
    expect(client.requests[0]?.signal.aborted).toBe(true);
  });

  it("sends nothing to a host whose source is over its rate limit", async () => {
    const asked: string[] = [];
    const { fetch, client } = policed({}, (host) => {
      asked.push(host);
      return false;
    });

    expect(await fetch(get(`${API}/v1`))).toEqual(
      err({ code: "policy_denied", reason: "rate_limited" }),
    );
    expect(asked).toEqual(["api.example.org"]);
    expect(client.requests).toEqual([]);
  });

  it("refuses a body over the size cap", async () => {
    const big = new Uint8Array(RUN_LIMITS.responseBytes + 1);
    const { fetch } = policed({ [`${API}/big`]: { status: 200, body: [big] } });
    expect(await fetch(get(`${API}/big`))).toEqual(err({ code: "too_large" }));
  });
});
