import type { Route } from "./route";

/** `GET /healthz`: the gateway is up. It reads nothing, so it answers even when a source is down. */
export const healthzRoute: Route = {
  matches: (pathname) => pathname === "/healthz",
  handle: async () =>
    new Response("ok", {
      status: 200,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
    }),
};
