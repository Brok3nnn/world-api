import { z } from "zod";
import { outputObjectNodeSchema } from "./output-schema";

const UNIT_MAX_LENGTH = 16;
const SENTENCE_MAX_LENGTH = 200;
const SENTENCE_FIELD = /\{[^{}]*\}/g;

/** The field names a sentence template refers to, such as `temperature_c` in `{temperature_c}`. */
function sentenceFields(sentence: string): string[] {
  // Each match is the field with its braces; the braces are one character on each side.
  return Array.from(sentence.matchAll(SENTENCE_FIELD), (match) => match[0].slice(1, -1));
}

/**
 * What an endpoint may return: the schema of its value, the field that is "the number", its
 * unit, and the template of the one-sentence answer. Nothing outside this spec ever leaves the
 * system.
 */
export const outputSpecSchema = z
  .strictObject({
    schema: outputObjectNodeSchema,
    /** The top-level field returned by the `number` shape. */
    primary: z.string().optional(),
    unit: z.string().min(1).max(UNIT_MAX_LENGTH).optional(),
    /** Template of the `text` shape; `{field}` is replaced by that field's value. */
    sentence: z.string().min(1).max(SENTENCE_MAX_LENGTH).optional(),
  })
  .superRefine((spec, context) => {
    const properties = spec.schema.properties;
    if (spec.primary !== undefined && !Object.hasOwn(properties, spec.primary)) {
      context.addIssue({
        code: "custom",
        path: ["primary"],
        message: `primary names "${spec.primary}", which is not a property of the schema.`,
      });
    }
    for (const field of sentenceFields(spec.sentence ?? "")) {
      if (!Object.hasOwn(properties, field)) {
        context.addIssue({
          code: "custom",
          path: ["sentence"],
          message: `The sentence uses {${field}}, which is not a property of the schema.`,
        });
      }
    }
  });

export type OutputSpec = z.infer<typeof outputSpecSchema>;
