import { z } from "zod";
import { instantSchema } from "../api/instant";
import { idSchema } from "../ids/id-schema";
import { buildStageSchema } from "./build-stage";

const MESSAGE_MAX_LENGTH = 300;

/**
 * One step of a build's story, shown to the requester as progress: a stage started, moved on,
 * completed or failed.
 */
export const buildEventSchema = z.strictObject({
  build_id: idSchema("build"),
  stage: buildStageSchema,
  kind: z.enum(["started", "progress", "completed", "failed"]),
  /** One sentence in plain words, such as "Trial run 12 of 20 passed". */
  message: z.string().min(1).max(MESSAGE_MAX_LENGTH),
  /** Small structured facts about the event, never source content or values. */
  detail: z.record(z.string(), z.json()).optional(),
  at: instantSchema,
});

export type BuildEvent = z.infer<typeof buildEventSchema>;
