import type { OutputSchemaNode } from "@repo/contracts/endpoint/output-schema";
import type { OutputSpec } from "@repo/contracts/endpoint/output-spec";
import { err, ok, type Result } from "@repo/core/result";
import type { JsonValue } from "../engine/json-value";
import type { EndpointData } from "../ports/endpoint-reader";

/** The rule of the output schema dialect that a value broke. */
export type FirewallRule =
  | "type"
  | "required"
  | "additional_property"
  | "enum"
  | "max_length"
  | "minimum"
  | "maximum"
  | "max_items";

/**
 * Where a value broke the output spec, as a JSON Pointer from the value's root, and which rule.
 * It never carries the offending value, so it can be logged and shown to the builder.
 */
export interface FirewallViolation {
  readonly path: string;
  readonly rule: FirewallRule;
}

/** The most violations one check reports; the first ones say enough to repair a recipe. */
const MAX_VIOLATIONS = 20;

function isObject(value: JsonValue): value is EndpointData {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isArray(value: JsonValue): value is readonly JsonValue[] {
  return Array.isArray(value);
}

/** A path one level down: `~` and `/` in a name are escaped as JSON Pointer requires. */
function below(path: string, name: string | number): string {
  return `${path}/${String(name).replaceAll("~", "~0").replaceAll("/", "~1")}`;
}

function broken(path: string, ...rules: (FirewallRule | false)[]): FirewallViolation[] {
  return rules.flatMap((rule) => (rule === false ? [] : [{ path, rule }]));
}

function checkObject(
  node: Extract<OutputSchemaNode, { type: "object" }>,
  value: JsonValue,
  path: string,
): FirewallViolation[] {
  if (!isObject(value)) {
    return broken(path, "type");
  }
  const extra = Object.keys(value)
    .filter((name) => !Object.hasOwn(node.properties, name))
    .flatMap((name) => broken(below(path, name), "additional_property"));
  const fields = Object.entries(node.properties).flatMap(([name, child]) => {
    const field = Object.hasOwn(value, name) ? value[name] : undefined;
    if (field === undefined) {
      return broken(below(path, name), node.required?.includes(name) === true && "required");
    }
    return check(child, field, below(path, name));
  });
  return [...extra, ...fields];
}

function check(node: OutputSchemaNode, value: JsonValue, path: string): FirewallViolation[] {
  switch (node.type) {
    case "string":
      return typeof value !== "string"
        ? broken(path, "type")
        : broken(
            path,
            node.enum !== undefined && !node.enum.includes(value) && "enum",
            node.maxLength !== undefined && [...value].length > node.maxLength && "max_length",
          );
    case "number":
      return typeof value !== "number" || !Number.isFinite(value)
        ? broken(path, "type")
        : broken(
            path,
            node.minimum !== undefined && value < node.minimum && "minimum",
            node.maximum !== undefined && value > node.maximum && "maximum",
          );
    case "boolean":
      return broken(path, typeof value !== "boolean" && "type");
    case "array":
      return !isArray(value)
        ? broken(path, "type")
        : [
            ...broken(
              path,
              node.maxItems !== undefined && value.length > node.maxItems && "max_items",
            ),
            ...value.flatMap((item, index) => check(node.items, item, below(path, index))),
          ];
    case "object":
      return checkObject(node, value, path);
  }
}

/**
 * Lets a value leave the system only if it matches the endpoint's output spec exactly: every
 * field declared, every rule of the dialect kept. The value is returned unchanged; otherwise
 * the violations say where and which rule, never what the value was.
 */
export function applyFirewall(
  value: JsonValue,
  spec: OutputSpec,
): Result<EndpointData, readonly FirewallViolation[]> {
  const violations = check(spec.schema, value, "");
  if (violations.length > 0 || !isObject(value)) {
    return err(violations.slice(0, MAX_VIOLATIONS));
  }
  return ok(value);
}
