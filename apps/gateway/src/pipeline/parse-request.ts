import { type CallParameters, callParametersSchema } from "@repo/contracts/api/call-parameters";
import { type EndpointPath, endpointPathSchema } from "@repo/contracts/api/endpoint-path";
import { err, ok, type Result } from "@repo/core/result";
import type { ErrorAnswer } from "../responses/error-response";
import { readQuery } from "./read-query";

/** A call of `GET /@{owner}/{slug}` whose path and query are known to be well formed. */
export interface ParsedCall {
  readonly path: EndpointPath;
  readonly parameters: CallParameters;
}

/** What a caller should do to fix each parameter. */
const PARAMETER_HINTS: Readonly<Record<string, string>> = {
  shape: "Use shape=json, number, text or csv.",
  max_age: "Use max_age in whole seconds, from 1 to 31536000.",
  max_price: "Use max_price as a whole number of credits, from 0 to 1000000.",
};

const PATH_HINT =
  "Call /@{owner}/{slug}: the owner is 2 to 32 of a-z, 0-9 and _, the slug lowercase words of a-z and 0-9 joined by single hyphens.";

function invalid(message: string, hint: string): Result<never, ErrorAnswer> {
  return err({ code: "invalid_request", message, hint });
}

/**
 * The first stage of an endpoint call: the path and the query as a typed call, or
 * `400 invalid_request` with a hint that names what to fix. Nothing the caller sent is echoed.
 */
export function parseRequest(request: Request): Result<ParsedCall, ErrorAnswer> {
  const url = new URL(request.url);
  const [owner, slug, ...rest] = url.pathname.replace(/^\/@/, "").split("/");
  const path = endpointPathSchema.safeParse({ owner, slug });
  if (!path.success || rest.length > 0) {
    return invalid("The path does not name an endpoint.", PATH_HINT);
  }
  const query = readQuery(url, Object.keys(PARAMETER_HINTS));
  if (!query.ok) {
    return query;
  }
  const parameters = callParametersSchema.safeParse(query.value);
  if (!parameters.success) {
    const name = String(parameters.error.issues[0]?.path[0] ?? "shape");
    return invalid(`The parameter ${name} is not valid.`, PARAMETER_HINTS[name] ?? PATH_HINT);
  }
  return ok({ path: path.data, parameters: parameters.data });
}
