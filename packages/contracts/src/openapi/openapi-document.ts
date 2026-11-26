import { z } from "zod";
import { callParametersSchema } from "../api/call-parameters";
import { endpointPathSchema } from "../api/endpoint-path";
import { ENVELOPE_EXAMPLE } from "../api/examples/envelope-example";
import { BUILD_STATUS_RESPONSE_EXAMPLE } from "../build/examples/build-examples";
import { idSchema } from "../ids/id-schema";
import { SEARCH_PAGE_EXAMPLE } from "../search/examples/search-page-example";
import { searchParametersSchema } from "../search/search-parameters";
import { componentRef, errorResponses, headerRefs, openApiComponents } from "./openapi-components";

const buildPathSchema = z.strictObject({ id: idSchema("build") });

/** The parameters a parameters schema accepts, described in the text form they are sent in. */
function parametersOf(schema: z.ZodType, location: "path" | "query") {
  const { properties = {}, required = [] } = z.toJSONSchema(schema, { io: "input" });
  return Object.entries(properties).map(([name, property]) => ({
    name,
    in: location,
    required: required.includes(name),
    schema: property,
  }));
}

/** A `200` answer with one JSON body, its example and how long it may be cached. */
function jsonAnswer(description: string, schemaId: string, example: object) {
  return {
    description,
    headers: headerRefs(["x-request-id", "cache-control"]),
    content: { "application/json": { schema: componentRef("schemas", schemaId), example } },
  };
}

const endpointCall = {
  operationId: "callEndpoint",
  summary: "Current value of one endpoint",
  parameters: [
    ...parametersOf(endpointPathSchema, "path"),
    ...parametersOf(callParametersSchema, "query"),
  ],
  responses: {
    200: {
      description: "The value in the shape asked for: the envelope for json, else the bare value.",
      headers: headerRefs([
        "x-request-id",
        "cache-control",
        "x-as-of",
        "x-next-refresh",
        "x-price-credits",
      ]),
      content: {
        "application/json": {
          schema: componentRef("schemas", "Envelope"),
          example: ENVELOPE_EXAMPLE,
        },
        "text/plain": { schema: { type: "string" } },
        "text/csv": { schema: { type: "string" } },
      },
    },
    ...errorResponses([
      "invalid_request",
      "payment_required",
      "not_found",
      "rate_limited",
      "internal_error",
      "degraded",
    ]),
  },
};

const search = {
  operationId: "searchCatalog",
  summary: "Find public endpoints in the catalog; free, within the caller's rate",
  parameters: parametersOf(searchParametersSchema, "query"),
  responses: {
    200: jsonAnswer(
      "One page of public endpoints, best match first.",
      "SearchPage",
      SEARCH_PAGE_EXAMPLE,
    ),
    ...errorResponses(["invalid_request", "rate_limited", "internal_error"]),
  },
};

const buildStatus = {
  operationId: "readBuildStatus",
  summary: "Status of a build",
  parameters: parametersOf(buildPathSchema, "path"),
  responses: {
    200: jsonAnswer(
      "Where the build is and, once it ended, how.",
      "BuildStatus",
      BUILD_STATUS_RESPONSE_EXAMPLE,
    ),
    ...errorResponses(["invalid_request", "not_found", "rate_limited", "internal_error"]),
  },
};

const health = {
  operationId: "checkHealth",
  summary: "Liveness of the gateway",
  responses: {
    200: {
      description: "The gateway is up.",
      headers: headerRefs(["x-request-id", "cache-control"]),
      content: { "text/plain": { schema: { type: "string", const: "ok" } } },
    },
  },
};

/** The OpenAPI document of the routes the gateway serves, derived from the contract schemas. */
export function openApiDocument() {
  return {
    openapi: "3.1.1",
    // The contract's major version: a breaking change needs a new path prefix (api.md).
    info: { title: "Public data API", version: "1" },
    paths: {
      "/@{owner}/{slug}": { get: endpointCall },
      "/search": { get: search },
      "/builds/{id}": { get: buildStatus },
      "/healthz": { get: health },
    },
    components: openApiComponents(),
  };
}

/** The document as it is committed: two-space JSON ending with a line break. */
export function openApiText(): string {
  return `${JSON.stringify(openApiDocument(), null, 2)}\n`;
}
