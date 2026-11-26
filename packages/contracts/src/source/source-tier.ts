import { z } from "zod";

/**
 * The compliance class of a source. `green`: cleared for commercial reuse and automated
 * access. `yellow`: allowed under recorded conditions. `red`: never used.
 */
export const sourceTierSchema = z.enum(["green", "yellow", "red"]);

export type SourceTier = z.infer<typeof sourceTierSchema>;
