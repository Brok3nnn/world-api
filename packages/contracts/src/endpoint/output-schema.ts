import { z } from "zod";

/**
 * One node of the fixed schema dialect an output spec may use. The types are written out by
 * hand because a recursive schema cannot infer its own type; the schemas below are checked
 * against them by the compiler.
 */
export type OutputSchemaNode =
  | { type: "string"; enum?: string[] | undefined; maxLength?: number | undefined }
  | { type: "number"; minimum?: number | undefined; maximum?: number | undefined }
  | { type: "boolean" }
  | { type: "array"; items: OutputSchemaNode; maxItems?: number | undefined }
  | OutputObjectNode;

export interface OutputObjectNode {
  type: "object";
  properties: Record<string, OutputSchemaNode>;
  required?: string[] | undefined;
  additionalProperties: false;
}

/** Field names are lowercase snake_case, so every shape renders them the same way. */
export const propertyNameSchema = z.string().regex(/^[a-z][a-z0-9_]{0,63}$/);

const stringNodeSchema = z.strictObject({
  type: z.literal("string"),
  enum: z.array(z.string()).min(1).optional(),
  maxLength: z.int().positive().optional(),
});

const numberNodeSchema = z.strictObject({
  type: z.literal("number"),
  minimum: z.number().optional(),
  maximum: z.number().optional(),
});

const booleanNodeSchema = z.strictObject({ type: z.literal("boolean") });

const arrayNodeSchema = z.strictObject({
  type: z.literal("array"),
  items: z.lazy(() => outputSchemaNodeSchema),
  maxItems: z.int().positive().optional(),
});

const objectNodeSchema = z
  .strictObject({
    type: z.literal("object"),
    properties: z.record(
      propertyNameSchema,
      z.lazy(() => outputSchemaNodeSchema),
    ),
    required: z.array(z.string()).optional(),
    additionalProperties: z.literal(false),
  })
  .superRefine((node, context) => {
    for (const name of node.required ?? []) {
      if (!Object.hasOwn(node.properties, name)) {
        context.addIssue({
          code: "custom",
          path: ["required"],
          message: `required names "${name}", which is not a property.`,
        });
      }
    }
  });

/** An object node. `additionalProperties: false` is mandatory at every level. */
export const outputObjectNodeSchema: z.ZodType<OutputObjectNode> = objectNodeSchema;

/** Any node of the dialect: string, number, boolean, array or object. Nothing else exists. */
export const outputSchemaNodeSchema: z.ZodType<OutputSchemaNode> = z.discriminatedUnion("type", [
  stringNodeSchema,
  numberNodeSchema,
  booleanNodeSchema,
  arrayNodeSchema,
  objectNodeSchema,
]);
