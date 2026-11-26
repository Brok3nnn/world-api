import { describe, expect, expectTypeOf, it } from "vitest";
import { z } from "zod";
import { parseEnvironment } from "./parse-environment";

const schema = z.object({
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  DATABASE_URL: z.url(),
  MODEL_GATEWAY_API_KEY: z.string().min(20),
});

const VALID = {
  LOG_LEVEL: "warn",
  DATABASE_URL: "https://db.example.com/main",
  MODEL_GATEWAY_API_KEY: "k".repeat(24),
  UNRELATED: "ignored",
};

/** The message of the error `run` throws; empty when it does not throw. */
function thrownMessage(run: () => unknown): string {
  try {
    run();
    return "";
  } catch (error) {
    return String(error);
  }
}

describe("parseEnvironment", () => {
  it("returns the variables the schema names, typed", () => {
    const env = parseEnvironment(schema, VALID);

    expect(env).toEqual({
      LOG_LEVEL: "warn",
      DATABASE_URL: "https://db.example.com/main",
      MODEL_GATEWAY_API_KEY: "k".repeat(24),
    });
    expectTypeOf(env.LOG_LEVEL).toEqualTypeOf<"debug" | "info" | "warn" | "error">();
  });

  it("applies the default of a variable that is not set", () => {
    const env = parseEnvironment(schema, { ...VALID, LOG_LEVEL: undefined });

    expect(env.LOG_LEVEL).toBe("info");
  });

  it("returns an object that cannot be changed", () => {
    expect(Object.isFrozen(parseEnvironment(schema, VALID))).toBe(true);
  });

  it("names a malformed variable", () => {
    expect(() => parseEnvironment(schema, { ...VALID, LOG_LEVEL: "loud" })).toThrow(
      "Invalid configuration. Check these variables: LOG_LEVEL.",
    );
  });

  it("names every missing variable, sorted", () => {
    expect(() => parseEnvironment(schema, {})).toThrow(
      "Invalid configuration. Check these variables: DATABASE_URL, MODEL_GATEWAY_API_KEY.",
    );
  });

  it("never puts a value into the message", () => {
    const secret = "short-secret";

    const message = thrownMessage(() =>
      parseEnvironment(schema, { ...VALID, MODEL_GATEWAY_API_KEY: secret }),
    );

    expect(message).toContain("MODEL_GATEWAY_API_KEY");
    expect(message).not.toContain(secret);
  });

  it("names a variable once when it breaks several rules", () => {
    const strict = z.object({ PORT: z.string().min(4).regex(/^\d+$/) });

    expect(() => parseEnvironment(strict, { PORT: "ab" })).toThrow(
      "Invalid configuration. Check these variables: PORT.",
    );
  });

  it("points at the configuration as a whole when a problem has no variable", () => {
    const needsOne = z
      .object({ A: z.string().optional(), B: z.string().optional() })
      .refine((env) => env.A !== undefined || env.B !== undefined);

    expect(() => parseEnvironment(needsOne, {})).toThrow(
      "Invalid configuration. Check these variables: environment.",
    );
  });
});
