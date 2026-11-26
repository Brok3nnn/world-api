import { z } from "zod";
import { httpsUrlSchema } from "../api/https-url";
import { instantSchema } from "../api/instant";
import { sourceCapabilitiesSchema } from "./source-capabilities";
import { sourceTierSchema } from "./source-tier";

const NAME_MAX_LENGTH = 80;
const TEXT_MAX_LENGTH = 300;
const TERMS_MAX_LENGTH = 500;
const HOSTS_MAX = 10;

/** A host name such as `api.example.org`: lowercase labels joined by dots. */
const hostSchema = z
  .string()
  .regex(/^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/);

/**
 * An approved origin of data, as the registry records it: where it may be fetched from, the
 * licence and the attribution it requires, the terms behind its tier and where they were read,
 * and what it offers.
 */
export const sourceDefinitionSchema = z
  .strictObject({
    name: z.string().min(1).max(NAME_MAX_LENGTH),
    /** The only hosts a recipe using this source may fetch. */
    hosts: z.array(hostSchema).min(1).max(HOSTS_MAX),
    /** Where the source publishes its data; returned in `sources` as `url`. */
    docs_url: httpsUrlSchema,
    /** The licence the data is used under, by its short name, such as `CC BY 4.0`. */
    licence: z.string().min(1).max(NAME_MAX_LENGTH),
    /**
     * The text the licence requires next to every value, or `null` when it requires none. It is
     * returned in `sources` exactly as written, so it holds no placeholders.
     */
    attribution: z.string().min(1).max(TEXT_MAX_LENGTH).nullable(),
    /** The conditions read in the source's terms when its tier was decided. Never returned. */
    terms: z.string().min(1).max(TERMS_MAX_LENGTH),
    /** Where the terms that justify the tier can be read. */
    evidence_url: httpsUrlSchema,
    tier: sourceTierSchema,
    policy_checked_at: instantSchema,
    rate_limit_per_min: z.int().positive(),
    capabilities: sourceCapabilitiesSchema,
  })
  .superRefine((source, context) => {
    source.capabilities.offerings.forEach((offering, index) => {
      const host = new URL(offering.sample_url).hostname;
      if (!source.hosts.includes(host)) {
        context.addIssue({
          code: "custom",
          path: ["capabilities", "offerings", index, "sample_url"],
          message: `The sample is on ${host}, which is not one of the source's hosts.`,
        });
      }
    });
  });

export type SourceDefinition = z.infer<typeof sourceDefinitionSchema>;
