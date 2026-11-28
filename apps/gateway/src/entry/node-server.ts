import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { RandomSource } from "@repo/core/ids/random-source";
import type { Gateway } from "../app";
import { assignRequestId } from "../pipeline/assign-request-id";
import { errorResponse } from "../responses/error-response";

/** The randomness of the request ids this server assigns itself. */
const RANDOM: RandomSource = { bytes: (length) => crypto.getRandomValues(new Uint8Array(length)) };

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

/**
 * The answer to a request that Node accepts but the Fetch API cannot represent, such as `TRACE`
 * or a malformed `Host` header. It never reaches the gateway, so it gets its request id here.
 */
function malformedRequest(): Response {
  const response = errorResponse({
    code: "invalid_request",
    message: "The request is malformed.",
    hint: "Send a GET request with a valid Host header.",
  });
  response.headers.set("x-request-id", assignRequestId(RANDOM));
  return response;
}

async function write(outgoing: ServerResponse, response: Response): Promise<void> {
  outgoing.writeHead(response.status, Object.fromEntries(response.headers));
  outgoing.end(Buffer.from(await response.arrayBuffer()));
}

async function respond(
  gateway: Gateway,
  incoming: IncomingMessage,
  outgoing: ServerResponse,
): Promise<void> {
  let request: Request;
  try {
    request = toRequest(incoming);
  } catch {
    // The Fetch API refuses this request; Node does not, so it is answered here.
    await write(outgoing, malformedRequest());
    return;
  }
  const response = await gateway(request, { address: incoming.socket.remoteAddress ?? "unknown" });
  await write(outgoing, response);
}

/** Serves the gateway with Node's HTTP server on the loopback interface; resolves once listening. */
export function serveNode(gateway: Gateway, port: number): Promise<Server> {
  const server = createServer((incoming, outgoing) => {
    respond(gateway, incoming, outgoing).catch(() => outgoing.destroy());
  });
  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve(server)));
}
