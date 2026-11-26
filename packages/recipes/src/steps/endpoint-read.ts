import { err, ok } from "@repo/core/result";
import type { StepExecutor } from "../engine/step-executor";

/**
 * Reads the current value of another endpoint through the run's `readEndpoint` port. The port
 * refuses loops and deep nesting; see `chainedEndpointReader`.
 */
export const endpointRead: StepExecutor<"endpoint.read"> = async (step, { deps }) => {
  const read = await deps.readEndpoint(step.ref);
  return read.ok ? ok({ value: read.value }) : err({ code: read.error.code });
};
