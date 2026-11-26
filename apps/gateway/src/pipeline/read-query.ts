import { err, ok, type Result } from "@repo/core/result";
import type { ErrorAnswer } from "../responses/error-response";

/**
 * The query as one value per name. A name the route does not take, or one given twice, is
 * `400 invalid_request`; `names` are the names the route takes, as the hint lists them.
 */
export function readQuery(
  url: URL,
  names: readonly string[],
): Result<Record<string, string>, ErrorAnswer> {
  const given = [...url.searchParams.keys()];
  const hint = `This route takes only ${names.join(", ")}, each at most once.`;
  if (given.some((name) => !names.includes(name))) {
    return err({
      code: "invalid_request",
      message: "The query has a parameter this route does not take.",
      hint,
    });
  }
  if (new Set(given).size !== given.length) {
    return err({
      code: "invalid_request",
      message: "The query gives a parameter more than once.",
      hint,
    });
  }
  return ok(Object.fromEntries(url.searchParams));
}
