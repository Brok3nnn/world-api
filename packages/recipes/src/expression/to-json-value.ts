import type { JsonValue } from "../engine/json-value";

function toJsonArray(items: readonly unknown[]): JsonValue[] | undefined {
  const converted: JsonValue[] = [];
  for (const item of items) {
    const json = toJsonValue(item);
    if (json === undefined) {
      return undefined;
    }
    converted.push(json);
  }
  return converted;
}

function toJsonObject(fields: object): { [key: string]: JsonValue } | undefined {
  const converted: { [key: string]: JsonValue } = {};
  for (const [key, field] of Object.entries(fields)) {
    const json = toJsonValue(field);
    if (json === undefined) {
      return undefined;
    }
    converted[key] = json;
  }
  return converted;
}

/**
 * A plain JSON copy of what an expression produced, or `undefined` when part of it is not JSON:
 * a function, a number that is not finite, or nothing at all.
 */
export function toJsonValue(value: unknown): JsonValue | undefined {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (Array.isArray(value)) {
    return toJsonArray(value);
  }
  return typeof value === "object" ? toJsonObject(value) : undefined;
}
