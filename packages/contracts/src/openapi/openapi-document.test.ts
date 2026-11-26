import { describe, expect, it } from "vitest";
import { callParametersSchema } from "../api/call-parameters";
import { ERROR_STATUS, errorCodeSchema } from "../api/error";
import { searchParametersSchema } from "../search/search-parameters";
import { openApiDocument, openApiText } from "./openapi-document";

const document = openApiDocument();

const operations = Object.entries(document.paths).map(([path, { get }]) => ({
  path,
  operation: get,
  parameters: "parameters" in get ? get.parameters : [],
}));

/** Every `$ref` anywhere inside a value. */
function refsIn(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(refsIn);
  }
  if (typeof value !== "object" || value === null) {
    return [];
  }
  return Object.entries(value).flatMap(([key, inner]) =>
    key === "$ref" && typeof inner === "string" ? [inner] : refsIn(inner),
  );
}

/** What a local reference such as `#/components/schemas/Envelope` points at. */
function resolve(ref: string): unknown {
  return ref
    .slice("#/".length)
    .split("/")
    .reduce<unknown>(
      (node, segment) =>
        typeof node === "object" && node !== null
          ? new Map(Object.entries(node)).get(segment)
          : undefined,
      document,
    );
}

describe("openApiDocument", () => {
  it("describes the routes the gateway serves, each with GET only", () => {
    expect(Object.keys(document.paths)).toEqual([
      "/@{owner}/{slug}",
      "/search",
      "/builds/{id}",
      "/healthz",
    ]);
    for (const methods of Object.values(document.paths)) {
      expect(Object.keys(methods)).toEqual(["get"]);
    }
  });

  it("resolves every reference to a component", () => {
    const refs = refsIn(document);
    expect(refs.length).toBeGreaterThan(0);
    for (const ref of refs) {
      expect(resolve(ref), ref).toBeDefined();
    }
  });

  it("declares every name of a path template as a required path parameter", () => {
    for (const { path, parameters } of operations) {
      const names = [...path.matchAll(/\{([a-z]+)\}/g)].map(([, name]) => name);
      const pathParameters = parameters.filter((parameter) => parameter.in === "path");
      expect(pathParameters.map((parameter) => parameter.name)).toEqual(names);
      expect(pathParameters.every((parameter) => parameter.required)).toBe(true);
    }
  });

  it("takes the query parameters from the contract schemas", () => {
    const queryOf = (path: string) =>
      operations
        .find((entry) => entry.path === path)
        ?.parameters.filter((parameter) => parameter.in === "query");
    expect(queryOf("/@{owner}/{slug}")?.map((parameter) => parameter.name)).toEqual(
      Object.keys(callParametersSchema.shape),
    );
    expect(queryOf("/search")?.map((parameter) => parameter.name)).toEqual(
      Object.keys(searchParametersSchema.shape),
    );
  });

  it("answers each error code with the status the contract gives it", () => {
    for (const { operation } of operations) {
      for (const [status, response] of Object.entries(operation.responses)) {
        const code = errorCodeSchema.safeParse(refsIn(response)[0]?.split("/").at(-1));
        if (code.success) {
          expect(Number(status)).toBe(ERROR_STATUS[code.data]);
        }
      }
    }
  });

  it("keeps no standalone-document keywords in the component schemas", () => {
    for (const schema of Object.values(document.components.schemas)) {
      expect(Object.keys(schema)).not.toContain("$schema");
      expect(Object.keys(schema)).not.toContain("$id");
    }
  });

  it("is committed as two-space JSON that ends with a line break", () => {
    const text = openApiText();
    expect(JSON.parse(text)).toEqual(document);
    expect(text.endsWith("}\n")).toBe(true);
  });
});
