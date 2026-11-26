import { z } from "zod";

/** Who can find and call an endpoint: its owner, anyone with the link, or everyone. */
export const visibilitySchema = z.enum(["private", "unlisted", "public"]);

export type Visibility = z.infer<typeof visibilitySchema>;
