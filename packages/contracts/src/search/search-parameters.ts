import { z } from "zod";
import { integerText } from "../api/integer-text";
import { queryTextSchema } from "../api/query-text";

/** Page sizes of `GET /search`: what a caller gets by default and the most it may ask for. */
export const SEARCH_PAGE_SIZE = { default: 20, max: 50 } as const;

const CURSOR_MAX_LENGTH = 200;

/** The query parameters of `GET /search`, parsed from their text form. */
export const searchParametersSchema = z.strictObject({
  q: queryTextSchema,
  limit: integerText({ min: 1, max: SEARCH_PAGE_SIZE.max }).default(SEARCH_PAGE_SIZE.default),
  /** Opaque position of the next page, taken from the previous response. */
  cursor: z.string().min(1).max(CURSOR_MAX_LENGTH).optional(),
});

export type SearchParameters = z.infer<typeof searchParametersSchema>;
