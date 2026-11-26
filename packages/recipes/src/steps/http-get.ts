import type { RecipeStep } from "@repo/contracts/recipe/recipe-step";
import { err, ok, type Result } from "@repo/core/result";
import type { JsonValue } from "../engine/json-value";
import type { StepFailure } from "../engine/run-failure";
import type { StepExecutor } from "../engine/step-executor";
import { decodeCsv } from "./decode-csv";

type FetchFormat = Extract<RecipeStep, { use: "http.get" }>["expect"];

const UNEXPECTED: StepFailure = { code: "unexpected_content" };
const HTTP_OK_FIRST = 200;
const HTTP_OK_LAST = 299;

/** Types a server sends when it does not say what the body is; they contradict nothing. */
const UNDECLARED = new Set(["text/plain", "application/octet-stream"]);
const JSON_TYPES = new Set(["application/json", "text/json"]);
const HTML_TYPES = new Set(["text/html", "application/xhtml+xml"]);
const CSV_TYPES = new Set([
  "text/csv",
  "application/csv",
  "text/comma-separated-values",
  "application/vnd.ms-excel",
]);

/** Whether a declared media type agrees with the format a step expects. */
const AGREES: Readonly<Record<FetchFormat, (type: string) => boolean>> = {
  json: (type) => JSON_TYPES.has(type) || type.endsWith("+json"),
  text: (type) =>
    type.startsWith("text/") ||
    JSON_TYPES.has(type) ||
    type.endsWith("+json") ||
    type.endsWith("+xml") ||
    type === "application/xml",
  html: (type) => HTML_TYPES.has(type),
  csv: (type) => CSV_TYPES.has(type),
};

function parseJson(body: string): Result<JsonValue, StepFailure> {
  try {
    // Safe: JSON.parse produces only JSON values. It reports invalid input only by throwing.
    return ok(JSON.parse(body) as JsonValue);
  } catch {
    return err(UNEXPECTED);
  }
}

/** The result of the step: parsed JSON, CSV records, or the text itself for `text` and `html`. */
function decode(expect: FetchFormat, body: string): Result<JsonValue, StepFailure> {
  switch (expect) {
    case "json":
      return parseJson(body);
    case "text":
    case "html":
      return ok(body);
    case "csv":
      return decodeCsv(body);
  }
}

/**
 * Fetches one URL of an approved source through the policed fetch and reads the body as the
 * step expects. A status outside 200–299, a content type that contradicts `expect`, or a body
 * that does not parse is a coded failure.
 */
export const httpGet: StepExecutor<"http.get"> = async (step, { deps }) => {
  const fetched = await deps.fetch({ url: step.url, headers: step.headers ?? {} });
  if (!fetched.ok) {
    return err({ code: fetched.error.code });
  }
  const { status, contentType, body, bytes } = fetched.value;
  if (status < HTTP_OK_FIRST || status > HTTP_OK_LAST) {
    return err({ code: "fetch_failed" });
  }
  if (contentType !== null && !UNDECLARED.has(contentType) && !AGREES[step.expect](contentType)) {
    return err(UNEXPECTED);
  }
  const value = decode(step.expect, body);
  return value.ok ? ok({ value: value.value, bytes }) : value;
};
