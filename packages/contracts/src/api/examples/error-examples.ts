import type { ErrorBody, ErrorCode } from "../error";

/**
 * One example body per error code. `building` is not here: its body also carries the build id
 * and has its own example.
 */
export const ERROR_EXAMPLES = {
  invalid_request: {
    error: {
      code: "invalid_request",
      message: 'Unknown shape "xml".',
      hint: "Use one of: json, number, text, csv.",
    },
  },
  payment_required: {
    error: {
      code: "payment_required",
      message: "This call costs more than max_price.",
      hint: "It costs 2 credits; raise max_price or leave it out.",
    },
  },
  not_found: {
    error: { code: "not_found", message: "No such API.", hint: "Check the owner and the name." },
  },
  not_buildable: {
    error: {
      code: "not_buildable",
      message: "No permitted, reliable source answers this.",
      hint: "Rephrase the question. You were not charged.",
    },
  },
  rate_limited: {
    error: { code: "rate_limited", message: "Too many calls.", hint: "Retry after 12 seconds." },
  },
  internal_error: {
    error: { code: "internal_error", message: "Something went wrong on our side." },
  },
  degraded: {
    error: {
      code: "degraded",
      message: "The source is failing and no recent value exists.",
      hint: "Retry later. You were not charged.",
    },
  },
} as const satisfies Record<Exclude<ErrorCode, "building">, ErrorBody>;
