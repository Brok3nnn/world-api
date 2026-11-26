import { z } from "zod";
import { handleSchema, slugSchema } from "../api/endpoint-path";
import { methodSchema } from "../api/method";
import { categorySchema } from "./category";
import { endpointStatusSchema } from "./endpoint-status";
import { endpointSummarySchema, endpointTitleSchema } from "./endpoint-text";
import { freshnessSchema } from "./freshness";
import { outputSpecSchema } from "./output-spec";
import { visibilitySchema } from "./visibility";

/**
 * Everything that defines an endpoint except its recipe: where it lives, how it is listed, how
 * fresh it is kept, what a call costs and what it may return.
 */
export const endpointDefinitionSchema = z.strictObject({
  owner: handleSchema,
  slug: slugSchema,
  title: endpointTitleSchema,
  summary: endpointSummarySchema,
  category: categorySchema,
  visibility: visibilitySchema,
  status: endpointStatusSchema,
  method: methodSchema,
  freshness: freshnessSchema,
  price_credits: z.int().nonnegative(),
  output_spec: outputSpecSchema,
});

export type EndpointDefinition = z.infer<typeof endpointDefinitionSchema>;
