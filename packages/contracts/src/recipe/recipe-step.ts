import { z } from "zod";
import { endpointRefSchema } from "../api/endpoint-path";
import { httpsUrlSchema } from "../api/https-url";

const URL_MAX_LENGTH = 2000;
const EXPRESSION_MAX_LENGTH = 2000;
const SELECTOR_MAX_LENGTH = 300;
const PATTERN_MAX_LENGTH = 300;
const HEADER_MAX_LENGTH = 200;

/** What a fetched response is read as. */
export const fetchFormatSchema = z.enum(["json", "text", "html", "csv"]);

/** The name later steps use to read a step's result: lowercase snake_case, at most 32. */
export const stepIdSchema = z.string().regex(/^[a-z][a-z0-9_]{0,31}$/);

/** One expression of the embedded query-and-transform language. Evaluated by the engine. */
export const expressionSchema = z.string().min(1).max(EXPRESSION_MAX_LENGTH);

/** Fetches one URL of an approved source. Only these request headers may be set. */
const httpGetStepSchema = z.strictObject({
  id: stepIdSchema,
  use: z.literal("http.get"),
  url: httpsUrlSchema.max(URL_MAX_LENGTH),
  expect: fetchFormatSchema,
  headers: z
    .strictObject({
      accept: z.string().min(1).max(HEADER_MAX_LENGTH).optional(),
      "accept-language": z.string().min(1).max(HEADER_MAX_LENGTH).optional(),
    })
    .optional(),
});

/** Computes a result from earlier results with one expression. */
const transformStepSchema = z.strictObject({
  id: stepIdSchema,
  use: z.literal("transform"),
  expr: expressionSchema,
});

/** Reads text, or an attribute, from elements of an HTML result. */
const htmlSelectStepSchema = z.strictObject({
  id: stepIdSchema,
  use: z.literal("html.select"),
  from: stepIdSchema,
  selector: z.string().min(1).max(SELECTOR_MAX_LENGTH),
  attr: z
    .string()
    .regex(/^[a-z][a-z0-9-]{0,63}$/)
    .optional(),
  all: z.boolean().optional(),
});

/** Captures groups from a text result with a pattern. */
const textMatchStepSchema = z.strictObject({
  id: stepIdSchema,
  use: z.literal("text.match"),
  from: stepIdSchema,
  pattern: z.string().min(1).max(PATTERN_MAX_LENGTH),
  flags: z
    .string()
    .regex(/^(?!.*(.).*\1)[imsu]*$/)
    .optional(),
});

/** Reads the current value of another endpoint. This is how a mix is built. */
const endpointReadStepSchema = z.strictObject({
  id: stepIdSchema,
  use: z.literal("endpoint.read"),
  ref: endpointRefSchema,
});

/** One step of a recipe. The five kinds below are everything a recipe can do. */
export const recipeStepSchema = z.discriminatedUnion("use", [
  httpGetStepSchema,
  transformStepSchema,
  htmlSelectStepSchema,
  textMatchStepSchema,
  endpointReadStepSchema,
]);

export type RecipeStep = z.infer<typeof recipeStepSchema>;
