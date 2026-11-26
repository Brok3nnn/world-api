import { z } from "zod";

/** The catalog category an endpoint is listed under. */
export const categorySchema = z.enum([
  "weather",
  "environment",
  "wildlife",
  "finance",
  "energy",
  "transport",
  "developer",
  "knowledge",
  "places",
  "commerce",
  "jobs",
]);

export type Category = z.infer<typeof categorySchema>;
