import { z } from "zod";
import { httpsUrlSchema } from "../api/https-url";
import { fetchFormatSchema } from "../recipe/recipe-step";

const NAME_MAX_LENGTH = 80;
const DESCRIPTION_MAX_LENGTH = 280;
const KEYWORD_MAX_LENGTH = 40;
const KEYWORDS_MAX = 20;
const OFFERINGS_MAX = 20;

/** One kind of data a source offers, with a real request that shows a sample of it. */
const sourceOfferingSchema = z.strictObject({
  name: z.string().min(1).max(NAME_MAX_LENGTH),
  description: z.string().min(1).max(DESCRIPTION_MAX_LENGTH),
  /** Lowercase words that match a request to this offering. */
  keywords: z
    .array(
      z
        .string()
        .regex(/^[a-z0-9][a-z0-9 -]*$/)
        .max(KEYWORD_MAX_LENGTH),
    )
    .min(1)
    .max(KEYWORDS_MAX),
  /** A request the builder may fetch to see what the offering returns. */
  sample_url: httpsUrlSchema,
  format: fetchFormatSchema,
});

/** What a source offers, in a form the builder can search and sample. */
export const sourceCapabilitiesSchema = z.strictObject({
  offerings: z.array(sourceOfferingSchema).min(1).max(OFFERINGS_MAX),
});

export type SourceCapabilities = z.infer<typeof sourceCapabilitiesSchema>;
