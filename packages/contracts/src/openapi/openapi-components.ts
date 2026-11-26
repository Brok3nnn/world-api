import { z } from "zod";
import { envelopeSchema } from "../api/envelope";
import { ERROR_STATUS, errorBodySchema } from "../api/error";
import { ERROR_EXAMPLES } from "../api/examples/error-examples";
import { jsonValueSchema } from "../api/json-value";
import { buildStatusResponseSchema } from "../build/build-status-response";
import { searchPageSchema } from "../search/search-page";

/** The response bodies, each one component that the others and the paths refer to. */
const BODY_SCHEMAS = {
  JsonValue: jsonValueSchema,
  Envelope: envelopeSchema,
  ErrorBody: errorBodySchema,
  SearchPage: searchPageSchema,
  BuildStatus: buildStatusResponseSchema,
};

const INSTANT = { type: "string", format: "date-time" } as const;
const COUNT = { type: "integer", minimum: 0 } as const;
const TEXT = { type: "string" } as const;

/** The response headers, by name. */
const HEADERS = {
  "x-request-id": header("Id of this call; it names the call in every log line.", TEXT),
  "cache-control": header("How long a shared cache may keep the answer.", TEXT),
  "retry-after": header("Seconds to wait before calling again.", COUNT),
  "x-as-of": header("When the value was observed at the source. Shapes other than json.", INSTANT),
  "x-next-refresh": header(
    "Earliest time a newer value can exist. Shapes other than json.",
    INSTANT,
  ),
  "x-price-credits": header("What this call cost, in credits. Shapes other than json.", COUNT),
};

type HeaderName = keyof typeof HEADERS;

/** The codes whose response says, in `retry-after`, when to call again. */
const RETRY_LATER: readonly ExampledCode[] = ["rate_limited", "degraded"];

type ExampledCode = keyof typeof ERROR_EXAMPLES;

/** The error responses of the routes served today, by code, with when each is returned. */
const ERROR_RESPONSES = {
  invalid_request: errorComponent("invalid_request", "Malformed path, parameter or shape."),
  payment_required: errorComponent(
    "payment_required",
    "The answer costs more than max_price; nothing was refreshed or charged.",
  ),
  not_found: errorComponent("not_found", "No such endpoint or build."),
  rate_limited: errorComponent("rate_limited", "Too many calls."),
  internal_error: errorComponent(
    "internal_error",
    "A defect on the platform's side. The body has no hint.",
  ),
  degraded: errorComponent(
    "degraded",
    "The source failed and no acceptable value exists. Not charged.",
  ),
};

type ServedErrorCode = keyof typeof ERROR_RESPONSES;

function header(description: string, schema: object) {
  return { description, schema };
}

/** A reference to one component of the document. */
export function componentRef(kind: "schemas" | "headers" | "responses", id: string) {
  return { $ref: `#/components/${kind}/${id}` };
}

/** The `headers` of a response: a reference to each named header. */
export function headerRefs(names: readonly HeaderName[]) {
  return Object.fromEntries(names.map((name) => [name, componentRef("headers", name)]));
}

/** The error responses of one operation, keyed by their status. */
export function errorResponses(codes: readonly ServedErrorCode[]) {
  return Object.fromEntries(
    codes.map((code) => [ERROR_STATUS[code], componentRef("responses", code)]),
  );
}

/** The JSON Schema of every body, without the keywords that belong to a standalone document. */
function bodySchemas() {
  const registry = z.registry<{ id: string }>();
  for (const [id, schema] of Object.entries(BODY_SCHEMAS)) {
    registry.add(schema, { id });
  }
  const { schemas } = z.toJSONSchema(registry, { uri: (id) => `#/components/schemas/${id}` });
  return Object.fromEntries(
    Object.entries(schemas).map(([id, { $schema: _dialect, $id: _id, ...schema }]) => [id, schema]),
  );
}

function errorComponent(code: ExampledCode, description: string) {
  return {
    description,
    headers: headerRefs(
      RETRY_LATER.includes(code) ? ["x-request-id", "retry-after"] : ["x-request-id"],
    ),
    content: {
      "application/json": {
        schema: componentRef("schemas", "ErrorBody"),
        example: ERROR_EXAMPLES[code],
      },
    },
  };
}

/** The `components` section: body schemas, headers and the error responses. */
export function openApiComponents() {
  return { schemas: bodySchemas(), headers: HEADERS, responses: ERROR_RESPONSES };
}
