import { z } from "zod";

/** The closed list of machine codes a non-200 response can carry. */
export const errorCodeSchema = z.enum([
  "building",
  "invalid_request",
  "payment_required",
  "not_found",
  "not_buildable",
  "rate_limited",
  "internal_error",
  "degraded",
]);

export type ErrorCode = z.infer<typeof errorCodeSchema>;

/** The HTTP status each code is returned with. No outcome listed here is ever charged. */
export const ERROR_STATUS = {
  building: 202,
  invalid_request: 400,
  payment_required: 402,
  not_found: 404,
  not_buildable: 404,
  rate_limited: 429,
  internal_error: 500,
  degraded: 503,
} as const satisfies Record<ErrorCode, number>;

/** The body of every non-200 response: one stable code, and what the caller should do. */
export const errorBodySchema = z.strictObject({
  error: z.strictObject({
    code: errorCodeSchema,
    message: z.string().min(1),
    hint: z.string().min(1).optional(),
  }),
});

export type ErrorBody = z.infer<typeof errorBodySchema>;
