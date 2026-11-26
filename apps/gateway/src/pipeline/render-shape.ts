import type { Envelope } from "@repo/contracts/api/envelope";
import type { Shape } from "@repo/contracts/api/shape";
import { err, ok, type Result } from "@repo/core/result";
import { renderCsv } from "@repo/core/shape/render-csv";
import { renderNumber } from "@repo/core/shape/render-number";
import { renderText } from "@repo/core/shape/render-text";
import type { ShapeFailure } from "@repo/core/shape/shape-failure";
import { supportedShapes } from "@repo/core/shape/supported-shapes";
import { secondsBetween } from "@repo/core/time/duration";
import type { ServedEndpoint } from "../ports/endpoint-directory";
import type { ErrorAnswer } from "../responses/error-response";

/** The content type of each shape that is not the envelope. */
const TEXT_TYPES: Readonly<Record<"number" | "text" | "csv", string>> = {
  number: "text/plain; charset=utf-8",
  text: "text/plain; charset=utf-8",
  csv: "text/csv; charset=utf-8",
};

/** Public values may be cached by anyone until they can change; nothing else may be cached. */
function cacheControl(endpoint: ServedEndpoint, envelope: Envelope, now: Date): string {
  const secondsLeft = Math.max(0, secondsBetween(now, new Date(envelope.next_refresh)));
  return endpoint.definition.visibility === "public"
    ? `public, max-age=${secondsLeft}`
    : "private, no-store";
}

function body(
  shape: "number" | "text" | "csv",
  envelope: Envelope,
  endpoint: ServedEndpoint,
): Result<string, ShapeFailure> {
  const spec = endpoint.definition.output_spec;
  switch (shape) {
    case "number":
      return renderNumber(envelope.data, spec);
    case "text":
      return renderText(envelope.data, spec);
    case "csv":
      return renderCsv(envelope.data, spec);
  }
}

/**
 * The response in the shape the call asked for, with the content type and headers of `api.md`.
 * A shape the endpoint cannot produce, or that this value cannot fill, is `400 invalid_request`
 * with a hint naming the shapes it supports.
 */
export function renderShape(
  endpoint: ServedEndpoint,
  envelope: Envelope,
  call: { readonly shape: Shape; readonly now: Date },
): Result<Response, ErrorAnswer> {
  const supported = supportedShapes(endpoint.definition.output_spec);
  const hint = `This endpoint answers shape=${supported.join(", ")}.`;
  const cache = { "cache-control": cacheControl(endpoint, envelope, call.now) };
  if (call.shape === "json") {
    return ok(Response.json(envelope, { headers: cache }));
  }
  if (!supported.includes(call.shape)) {
    return err({
      code: "invalid_request",
      message: `This endpoint cannot answer shape=${call.shape}.`,
      hint,
    });
  }
  const rendered = body(call.shape, envelope, endpoint);
  if (!rendered.ok) {
    return err({
      code: "invalid_request",
      message: "This value lacks a field the shape needs.",
      hint,
    });
  }
  const headers = {
    ...cache,
    "content-type": TEXT_TYPES[call.shape],
    "x-as-of": envelope.as_of,
    "x-next-refresh": envelope.next_refresh,
    "x-price-credits": String(envelope.price_credits),
  };
  return ok(new Response(rendered.value, { headers }));
}
