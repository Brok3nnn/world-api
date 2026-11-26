import { parseEnvironment } from "@repo/core/env/parse-environment";
import { z } from "zod";
import { userAgentContactSchema } from "../egress/user-agent";

const commandEnvironmentSchema = z.object({
  USER_AGENT_CONTACT: userAgentContactSchema,
});

export type CommandEnvironment = z.infer<typeof commandEnvironmentSchema>;

/**
 * The configuration of the commands that fetch live sources: the recorder and the proofs.
 * Without a contact they stop before anything is fetched.
 */
export function readCommandEnvironment(
  source: Readonly<Record<string, string | undefined>> = process.env,
): Readonly<CommandEnvironment> {
  return parseEnvironment(commandEnvironmentSchema, source);
}
