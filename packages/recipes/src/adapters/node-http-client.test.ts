import { createServer, type Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { BodyReader } from "../ports/body-reader";
import type { HttpRequest } from "../ports/http-client";
import { nodeHttpClient } from "./node-http-client";

/** What the in-process server saw of each request. */
const seen: { host?: string; agent?: string }[] = [];

const server: Server = createServer((request, response) => {
  seen.push({ host: request.headers.host, agent: request.headers["user-agent"] });
  if (request.url === "/data") {
    response.writeHead(200, { "content-type": "text/csv; charset=utf-8" });
    response.write("a;b\n");
    response.end("1;2\n");
  } else if (request.url === "/moved") {
    response.writeHead(302, { location: "https://cdn.example.org/data" }).end();
  } else if (request.url === "/broken") {
    response.writeHead(200, { "content-length": "100" });
    response.write("part", () => response.socket?.destroy());
  }
  // Any other path never answers.
});

function portOf(listening: Server): number {
  const address = listening.address();
  if (address === null || typeof address === "string") {
    throw new Error("The test server is not listening on a TCP port.");
  }
  return address.port;
}

let port = 0;

beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  port = portOf(server);
});

afterAll(async () => {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
});

/** A request for a public host name, pinned to the in-process server's address. */
function pinned(path: string, fields: Partial<HttpRequest> = {}): HttpRequest {
  return {
    url: `http://api.example.org:${port}${path}`,
    address: "127.0.0.1",
    headers: { "user-agent": "data-engine-test/1" },
    signal: new AbortController().signal,
    ...fields,
  };
}

async function readAll(body: BodyReader): Promise<string> {
  const decoder = new TextDecoder();
  let text = "";
  for (;;) {
    const read = await body.next();
    if (!read.ok) {
      return "(broken)";
    }
    if (read.value === null) {
      return text;
    }
    text += decoder.decode(read.value);
  }
}

describe("nodeHttpClient", () => {
  it("connects to the given address, not to what the host name resolves to", async () => {
    const sent = await nodeHttpClient(pinned("/data"));

    expect(sent.ok && sent.value.status).toBe(200);
    expect(sent.ok && sent.value.contentType).toBe("text/csv; charset=utf-8");
    expect(sent.ok && (await readAll(sent.value.body))).toBe("a;b\n1;2\n");
    expect(seen.at(-1)).toEqual({ host: `api.example.org:${port}`, agent: "data-engine-test/1" });
  });

  it("returns a redirect as a response, without following it", async () => {
    const sent = await nodeHttpClient(pinned("/moved"));

    expect(sent.ok && [sent.value.status, sent.value.location]).toEqual([
      302,
      "https://cdn.example.org/data",
    ]);
  });

  it("reports a body whose connection breaks before it ends", async () => {
    const sent = await nodeHttpClient(pinned("/broken"));

    expect(sent.ok && (await readAll(sent.value.body))).toBe("(broken)");
  });

  it("ends a request that is still waiting when its signal aborts", async () => {
    const controller = new AbortController();
    const waiting = nodeHttpClient(pinned("/silent", { signal: controller.signal }));

    controller.abort();

    expect(await waiting).toEqual({ ok: false, error: { code: "fetch_failed" } });
  });

  it("fails when nothing listens at the given address", async () => {
    const closed = createServer();
    await new Promise<void>((resolve) => closed.listen(0, "127.0.0.1", resolve));
    const closedPort = portOf(closed);
    await new Promise((resolve) => closed.close(resolve));

    const refused = await nodeHttpClient(
      pinned("/data", { url: `http://api.example.org:${closedPort}/` }),
    );

    expect(refused).toEqual({ ok: false, error: { code: "fetch_failed" } });
  });

  it("connects to an IPv6 address given in brackets", async () => {
    const sent = await nodeHttpClient(pinned("/data", { address: "[::1]" }));

    // The server listens on IPv4 only, so a connection made over IPv6 is refused.
    expect(sent).toEqual({ ok: false, error: { code: "fetch_failed" } });
  });
});
