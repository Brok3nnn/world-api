import { z } from "zod";

/** How a value is rendered in a response. `json` is the default and returns the envelope. */
export const shapeSchema = z.enum(["json", "number", "text", "csv"]);

export type Shape = z.infer<typeof shapeSchema>;
