import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Clock } from "@repo/core/time/clock";
import { nodeHttpClient } from "../adapters/node-http-client";
import { createNodeResolveHost } from "../adapters/node-resolve-host";
import { timersWait } from "../adapters/timers-wait";
import { type CommandEnvironment, readCommandEnvironment } from "../commands/env";
import { userAgentFor } from "../egress/user-agent";
import { FRANKFURT_REPORT_FILE } from "../golden/frankfurt-report-file";
import { TOPEKA_WEATHER } from "../golden/topeka-weather";
import { NO_RATE_LIMIT } from "../ports/source-rate-limit";
import { exitCodeOf, PROOF_EXIT, proveRecipes } from "./prove-recipes";
import { renderProofReport } from "./render-proof-report";

/** JSON and HTML, five step kinds between them, from two countries' approved sources. */
const PROOF_RECIPES = [TOPEKA_WEATHER, FRANKFURT_REPORT_FILE];

/** The outermost boundary: a missing contact ends the proof with its own exit code. */
function environmentOrExit(): Readonly<CommandEnvironment> {
  try {
    return readCommandEnvironment();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : "Invalid configuration."}\n`);
    return process.exit(PROOF_EXIT.missingConfiguration);
  }
}

const environment = environmentOrExit();
const systemClock: Clock = { now: () => new Date() };
const ranAt = systemClock.now();
const evidences = await proveRecipes(
  PROOF_RECIPES,
  {
    http: nodeHttpClient,
    resolveHost: createNodeResolveHost(),
    wait: timersWait,
    userAgent: userAgentFor(environment.USER_AGENT_CONTACT),
    rateLimit: NO_RATE_LIMIT,
  },
  systemClock,
);
const exitCode = exitCodeOf(evidences, PROOF_RECIPES.length);
const report = renderProofReport({
  evidences,
  commit: execFileSync("git", ["rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim(),
  ranAt,
  passed: exitCode === PROOF_EXIT.pass,
});
const file = join(process.argv[2] ?? ".", `proof-a-${ranAt.toISOString().slice(0, 10)}.md`);
await writeFile(file, `${report}\n`, "utf8");
process.stdout.write(`${report}\n\nReport written to ${file}.\n`);
process.exitCode = exitCode;
