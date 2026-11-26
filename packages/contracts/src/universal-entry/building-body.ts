import { z } from "zod";
import { httpsUrlSchema } from "../api/https-url";
import { idSchema } from "../ids/id-schema";

/**
 * The body of `202 building`: the usual error object, plus the build that was started and
 * where to follow it.
 */
export const buildingBodySchema = z.strictObject({
  error: z.strictObject({
    code: z.literal("building"),
    message: z.string().min(1),
    hint: z.string().min(1),
  }),
  build_id: idSchema("build"),
  status_url: httpsUrlSchema,
});

export type BuildingBody = z.infer<typeof buildingBodySchema>;
