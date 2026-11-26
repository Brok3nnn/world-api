import { parseEnvironment } from "@repo/core/env/parse-environment";
import { userAgentContactSchema } from "@repo/recipes/egress/user-agent";
import { z } from "zod";

const gatewayEnvironmentSchema = z.object({
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  USER_AGENT_CONTACT: userAgentContactSchema,
});

export type GatewayEnvironment = z.infer<typeof gatewayEnvironmentSchema>;

/** The gateway's configuration, read once at start-up; a missing variable stops it there. */
export function readGatewayEnvironment(
  source: Readonly<Record<string, string | undefined>> = process.env,
): Readonly<GatewayEnvironment> {
  return parseEnvironment(gatewayEnvironmentSchema, source);
}
