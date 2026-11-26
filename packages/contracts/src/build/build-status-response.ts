import { z } from "zod";
import { httpsUrlSchema } from "../api/https-url";
import { idSchema } from "../ids/id-schema";
import { buildStageSchema } from "./build-stage";
import { buildStatusSchema } from "./build-status";

/** The body of `GET /builds/{id}`: where the build is and, once it ended, how. */
export const buildStatusResponseSchema = z.strictObject({
  id: idSchema("build"),
  status: buildStatusSchema,
  /** The stage being run, or `null` before the first and after the last. */
  stage: buildStageSchema.nullable(),
  /** From 0 at the start to 1 when finished. */
  progress: z.number().min(0).max(1),
  /** The permanent URL of the endpoint once the build succeeded. */
  endpoint: httpsUrlSchema.nullable(),
  /** One sentence that explains a failure or a rejection. */
  reason: z.string().min(1).nullable(),
});

export type BuildStatusResponse = z.infer<typeof buildStatusResponseSchema>;
