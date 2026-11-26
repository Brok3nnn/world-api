import { z } from "zod";

/**
 * Where a build is. `rejected` means it must not or cannot be built; `failed` means the builder
 * could not finish. Neither is ever charged.
 */
export const buildStatusSchema = z.enum(["queued", "running", "succeeded", "failed", "rejected"]);

export type BuildStatus = z.infer<typeof buildStatusSchema>;
