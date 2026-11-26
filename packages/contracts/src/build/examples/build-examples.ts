import type { BuildRequest } from "../build-request";
import type { BuildSpec } from "../build-spec";
import type { BuildStatusResponse } from "../build-status-response";

/** A request as typed on the home page, with one setting chosen explicitly. */
export const BUILD_REQUEST_EXAMPLE = {
  text: "Free spots in the car park on Main Street",
  freshness: "15m",
} satisfies BuildRequest;

/** The reading of that request. */
export const BUILD_SPEC_EXAMPLE = {
  subject: "Free parking spots, Main Street car park",
  fields: [
    {
      name: "free_spots",
      type: "number",
      description: "Parking spots that are free right now.",
      unit: "spots",
      minimum: 0,
      maximum: 2000,
    },
  ],
  sources_count: 1,
  shape: "json",
  freshness: "15m",
} satisfies BuildSpec;

/** The build status of the API reference: a build in its test stage. */
export const BUILD_STATUS_RESPONSE_EXAMPLE = {
  id: "bld_01jd3k8m4q0000000000000000",
  status: "running",
  stage: "test",
  progress: 0.66,
  endpoint: null,
  reason: null,
} satisfies BuildStatusResponse;
