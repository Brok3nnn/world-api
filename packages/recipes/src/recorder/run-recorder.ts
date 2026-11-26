import type { CommandEnvironment } from "../commands/env";
import { createPolicedFetch } from "../egress/create-policed-fetch";
import { userAgentFor } from "../egress/user-agent";
import type { HttpClient } from "../ports/http-client";
import type { ResolveHost } from "../ports/resolve-host";
import { NO_RATE_LIMIT } from "../ports/source-rate-limit";
import type { Wait } from "../ports/wait";
import { toRecording } from "./to-recording";

const USAGE = "Usage: pnpm --filter @repo/recipes record <https URL> <recording file>";

/** What the recorder reaches outside itself; the command passes Node's, tests pass fakes. */
export interface RecorderContext {
  readonly environment: () => Readonly<CommandEnvironment>;
  readonly egress: {
    readonly http: HttpClient;
    readonly resolveHost: ResolveHost;
    readonly wait: Wait;
  };
  readonly write: (file: string, text: string) => Promise<void>;
  readonly report: (line: string) => void;
}

/**
 * Records one live response through the egress policy, with the URL's own host as the only
 * one allowed, and writes it as a recording. Returns the exit code. The configuration is read
 * first, so a missing contact stops the recorder before anything is fetched or written.
 */
export async function runRecorder(
  args: readonly string[],
  context: RecorderContext,
): Promise<number> {
  const environment = context.environment();
  const [url, file] = args;
  const host = URL.parse(url ?? "")?.hostname;
  if (url === undefined || file === undefined || host === undefined) {
    context.report(USAGE);
    return 2;
  }
  const policed = createPolicedFetch({
    ...context.egress,
    userAgent: userAgentFor(environment.USER_AGENT_CONTACT),
    allowedHosts: [host],
    rateLimit: NO_RATE_LIMIT,
  });
  const fetched = await policed({ url, headers: {} });
  if (!fetched.ok) {
    context.report(`Not recorded: ${fetched.error.code}.`);
    return 1;
  }
  await context.write(file, `${JSON.stringify(toRecording(url, fetched.value), null, 2)}\n`);
  context.report(
    `Recorded ${url} (status ${fetched.value.status}, ${fetched.value.bytes} bytes) in ${file}.`,
  );
  return 0;
}
