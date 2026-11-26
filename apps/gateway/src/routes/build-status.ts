import type { BuildStatusResponse } from "@repo/contracts/build/build-status-response";
import { parseId } from "@repo/core/ids/id";
import { limitRate } from "../pipeline/limit-rate";
import { readQuery } from "../pipeline/read-query";
import { errorResponse } from "../responses/error-response";
import type { Route } from "./route";

const PATH = /^\/builds\/([^/]+)$/;

const NOT_FOUND = {
  code: "not_found",
  message: "There is no such build.",
  hint: "Use the build_id or status_url of the build you started.",
} as const;

/**
 * `GET /builds/{id}`: where a build is, and once it succeeded, the permanent URL of its endpoint
 * on the origin the call came in on. A build changes quickly, so nothing caches the answer.
 */
export const buildStatusRoute: Route = {
  matches: (pathname) => PATH.test(pathname),
  handle: async (request, { deps, client }) => {
    const url = new URL(request.url);
    const query = readQuery(url, []);
    if (!query.ok) {
      return errorResponse(query.error);
    }
    const allowed = await limitRate(await deps.callers.identify(request, client), deps.rateLimiter);
    if (!allowed.ok) {
      return errorResponse(allowed.error);
    }
    const id = parseId("build", PATH.exec(url.pathname)?.[1]);
    const build = id.ok ? await deps.builds.status(id.value) : null;
    if (build === null) {
      return errorResponse(NOT_FOUND);
    }
    const body: BuildStatusResponse = {
      ...build,
      endpoint:
        build.endpoint === null
          ? null
          : `${url.origin}/@${build.endpoint.owner}/${build.endpoint.slug}`,
    };
    return Response.json(body, { headers: { "cache-control": "private, no-store" } });
  },
};
