import type { EndpointPath } from "@repo/contracts/api/endpoint-path";
import { err, ok, type Result } from "@repo/core/result";
import type { EndpointDirectory, ServedEndpoint } from "../ports/endpoint-directory";
import type { ErrorAnswer } from "../responses/error-response";

const NOT_FOUND: ErrorAnswer = {
  code: "not_found",
  message: "There is no such endpoint.",
  hint: "Check the owner and the slug, or find endpoints with /search?q=.",
};

/**
 * The endpoint a call names, if it answers calls: `live` or `degraded`, and not `private`, as
 * every caller is anonymous until keys exist. Anything else is `404 not_found`, the same answer
 * for a private endpoint as for none, so its existence is not revealed.
 */
export async function resolveEndpoint(
  path: EndpointPath,
  endpoints: EndpointDirectory,
): Promise<Result<ServedEndpoint, ErrorAnswer>> {
  const endpoint = await endpoints.find(path);
  if (endpoint === null) {
    return err(NOT_FOUND);
  }
  const { status, visibility } = endpoint.definition;
  const answers = (status === "live" || status === "degraded") && visibility !== "private";
  return answers ? ok(endpoint) : err(NOT_FOUND);
}
