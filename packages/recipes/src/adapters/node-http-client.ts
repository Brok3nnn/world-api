import { type IncomingMessage, request as plainRequest } from "node:http";
import { request as secureRequest } from "node:https";
import type { LookupFunction } from "node:net";
import { err, ok } from "@repo/core/result";
import type { BodyReader } from "../ports/body-reader";
import type { HttpClient } from "../ports/http-client";

const IPV4_FAMILY = 4;
const IPV6_FAMILY = 6;

/** A name lookup that answers with the one address the egress policy approved, and no other. */
function pinnedLookup(approved: string): LookupFunction {
  const address = approved.replace(/^\[(.*)\]$/, "$1");
  const family = address.includes(":") ? IPV6_FAMILY : IPV4_FAMILY;
  return (_host, options, callback) => {
    if (options.all === true) {
      callback(null, [{ address, family }]);
    } else {
      callback(null, address, family);
    }
  };
}

function bodyOf(response: IncomingMessage): BodyReader {
  const chunks = response[Symbol.asyncIterator]();
  return {
    next: () =>
      chunks.next().then(
        (read) => {
          const chunk: unknown = read.value;
          if (read.done === true) {
            return ok(null);
          }
          return chunk instanceof Uint8Array ? ok(chunk) : err({ code: "fetch_failed" });
        },
        () => err({ code: "fetch_failed" }),
      ),
  };
}

/**
 * The `HttpClient` of commands and Node entries. It connects to the address in the request and
 * never looks the host up again, while TLS still checks the certificate against the host name.
 * Connections are never pooled. Redirects come back as responses; the policed fetch decides. `http:` is served
 * only so tests can use an in-process server: the egress policy never lets it through.
 */
export const nodeHttpClient: HttpClient = (request) =>
  new Promise((resolve) => {
    const url = new URL(request.url);
    const send = url.protocol === "https:" ? secureRequest : plainRequest;
    const options = {
      method: "GET",
      // A fresh connection every time: a pooled one could lead somewhere this request was not approved for.
      agent: false,
      headers: request.headers,
      lookup: pinnedLookup(request.address),
      signal: request.signal,
    };
    const outgoing = send(url, options, (response) => {
      resolve(
        ok({
          status: response.statusCode ?? 0,
          contentType: response.headers["content-type"] ?? null,
          location: response.headers.location ?? null,
          body: bodyOf(response),
        }),
      );
    });
    outgoing.on("error", () => resolve(err({ code: "fetch_failed" })));
    outgoing.end();
  });
