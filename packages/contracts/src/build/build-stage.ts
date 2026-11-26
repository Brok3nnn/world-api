import { z } from "zod";

/** The stages of a build, in the order the pipeline runs them. */
export const buildStageSchema = z.enum([
  "interpret",
  "discover",
  "check-policy",
  "draft",
  "test",
  "publish",
]);

export type BuildStage = z.infer<typeof buildStageSchema>;
