import { sampleCreditCosts } from "@/config/site";
import type { BuildRequest } from "../types";

/** When the requester lets the builder decide, it blends up to this many sources. */
const AUTO_MAX_SOURCES = 3;

interface CreditRange {
  min: number;
  max: number;
}

/**
 * Expected price of one call: model-interpreted answers cost a flat rate, everything else one
 * credit per blended source.
 */
export function estimateCallCredits(request: Pick<BuildRequest, "shape" | "sources">): CreditRange {
  if (request.shape === "probability") {
    return { min: sampleCreditCosts.perModelAnswer, max: sampleCreditCosts.perModelAnswer };
  }
  if (request.sources === "auto") {
    return {
      min: sampleCreditCosts.perSourceCall,
      max: AUTO_MAX_SOURCES * sampleCreditCosts.perSourceCall,
    };
  }
  const credits = Number(request.sources) * sampleCreditCosts.perSourceCall;
  return { min: credits, max: credits };
}
