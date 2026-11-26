import { z } from "zod";
import { shapeSchema } from "../api/shape";
import { freshnessSchema } from "../endpoint/freshness";
import { propertyNameSchema } from "../endpoint/output-schema";
import { sourcesCountSchema } from "./build-request";

const SUBJECT_MAX_LENGTH = 120;
const DESCRIPTION_MAX_LENGTH = 200;
const UNIT_MAX_LENGTH = 16;
const FIELDS_MAX = 16;

const buildSpecFieldSchema = z.strictObject({
  name: propertyNameSchema,
  type: z.enum(["number", "string", "boolean"]),
  /** What the field means, in one sentence, for whoever drafts the recipe. */
  description: z.string().min(1).max(DESCRIPTION_MAX_LENGTH),
  unit: z.string().min(1).max(UNIT_MAX_LENGTH).optional(),
  /** The range a numeric value must stay inside to be plausible. */
  minimum: z.number().optional(),
  maximum: z.number().optional(),
});

/**
 * The structured reading of a request: what the endpoint is about, the fields it should
 * return, and every setting resolved to a value.
 */
export const buildSpecSchema = z.strictObject({
  subject: z.string().min(1).max(SUBJECT_MAX_LENGTH),
  fields: z.array(buildSpecFieldSchema).min(1).max(FIELDS_MAX),
  sources_count: sourcesCountSchema,
  shape: shapeSchema,
  freshness: freshnessSchema,
});

export type BuildSpec = z.infer<typeof buildSpecSchema>;
