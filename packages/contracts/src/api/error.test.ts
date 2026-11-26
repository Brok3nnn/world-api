import { describe, expect, it } from "vitest";
import { ERROR_STATUS, errorBodySchema, errorCodeSchema } from "./error";
import { ERROR_EXAMPLES } from "./examples/error-examples";

describe("ERROR_STATUS", () => {
  it("lists exactly the codes and statuses of the API reference", () => {
    expect(ERROR_STATUS).toEqual({
      building: 202,
      invalid_request: 400,
      payment_required: 402,
      not_found: 404,
      not_buildable: 404,
      rate_limited: 429,
      internal_error: 500,
      degraded: 503,
    });
  });

  it("has a status for every code and no other entry", () => {
    expect(Object.keys(ERROR_STATUS).sort()).toEqual([...errorCodeSchema.options].sort());
  });
});

describe("errorBodySchema", () => {
  it.each(Object.entries(ERROR_EXAMPLES))("accepts the example of %s", (code, example) => {
    expect(errorBodySchema.parse(example).error.code).toBe(code);
  });

  it("accepts a body without a hint", () => {
    expect(errorBodySchema.safeParse(ERROR_EXAMPLES.internal_error).success).toBe(true);
  });

  it.each([
    ["an unknown code", { error: { code: "teapot", message: "No." } }],
    ["a missing message", { error: { code: "not_found" } }],
    ["an empty message", { error: { code: "not_found", message: "" } }],
    ["an empty hint", { error: { code: "not_found", message: "No such API.", hint: "" } }],
    ["an extra field in the error", { error: { code: "not_found", message: "No.", stack: "x" } }],
    ["an extra field beside the error", { error: { code: "not_found", message: "No." }, ok: 0 }],
    ["no error object", { code: "not_found", message: "No." }],
  ])("rejects %s", (_rule, body) => {
    expect(errorBodySchema.safeParse(body).success).toBe(false);
  });
});
