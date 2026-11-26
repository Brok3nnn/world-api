import { z } from "zod";
import { handleSchema, slugSchema } from "../api/endpoint-path";
import { httpsUrlSchema } from "../api/https-url";
import { endpointSummarySchema, endpointTitleSchema } from "../endpoint/endpoint-text";
import { SEARCH_PAGE_SIZE } from "./search-parameters";

const searchResultSchema = z.strictObject({
  owner: handleSchema,
  slug: slugSchema,
  title: endpointTitleSchema,
  summary: endpointSummarySchema,
  /** The permanent URL to call from now on. */
  url: httpsUrlSchema,
  price_credits: z.int().nonnegative(),
});

/** One page of `GET /search`: public endpoints, best match first. */
export const searchPageSchema = z.strictObject({
  items: z.array(searchResultSchema).max(SEARCH_PAGE_SIZE.max),
  /** Pass as `cursor` to get the next page; `null` on the last page. */
  next_cursor: z.string().min(1).nullable(),
});

export type SearchPage = z.infer<typeof searchPageSchema>;
