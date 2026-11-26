import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { Gateway } from "../app";

/**
 * The incoming request as a Web-standard one, on the origin the caller used. Its body is
 * dropped, as every route is a `GET`.
 */
function toRequest(incoming: IncomingMessage): Request {
  const headers = new Headers();
  for (const [name, values] of Object.entries(incoming.headersDistinct)) {
    for (const value of values ?? []) {
      headers.append(name, value);
    }
  }
  // Node sets the URL and the method on every request a server receives. The origin is the one
  // the caller used: behind a proxy that ends TLS, `x-forwarded-proto` says it was https.
  const secure = headers.get("x-forwarded-proto")?.split(",")[0]?.trim() === "https";
  const origin = `${secure ? "https" : "http"}://${headers.get("host") ?? "localhost"}`;
  const url = new URL(String(incoming.url), origin);
  return new Request(url, { method: String(incoming.method), headers });
}

async function respond(
  gateway: Gateway,
  incoming: IncomingMessage,
  outgoing: ServerResponse,
): Promise<void> {
  const response = await gateway(toRequest(incoming), {
    address: incoming.socket.remoteAddress ?? "unknown",
  });
  outgoing.writeHead(response.status, Object.fromEntries(response.headers));
  outgoing.end(Buffer.from(await response.arrayBuffer()));
}

/** Serves the gateway with Node's HTTP server on the loopback interface; resolves once listening. */
export function serveNode(gateway: Gateway, port: number): Promise<Server> {
  const server = createServer((incoming, outgoing) => {
    void respond(gateway, incoming, outgoing);
  });
  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve(server)));
}
