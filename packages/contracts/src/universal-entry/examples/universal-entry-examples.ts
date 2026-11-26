import { ENVELOPE_EXAMPLE } from "../../api/examples/envelope-example";
import type { BuildingBody } from "../building-body";
import type { UniversalEntryHit } from "../universal-entry-hit";

/** `GET /get` answered from the catalog. */
export const UNIVERSAL_ENTRY_HIT_EXAMPLE = {
  ...ENVELOPE_EXAMPLE,
  endpoint: "https://api.example.com/@mira_field/forest-cam-12",
} as const satisfies UniversalEntryHit;

/** `GET /get` found nothing and started a build. */
export const BUILDING_BODY_EXAMPLE = {
  error: {
    code: "building",
    message: "Nothing matched, so a build started.",
    hint: "Poll status_url, or retry with wait=30.",
  },
  build_id: "bld_01jd3k8m4q0000000000000000",
  status_url: "https://api.example.com/builds/bld_01jd3k8m4q0000000000000000",
} as const satisfies BuildingBody;
