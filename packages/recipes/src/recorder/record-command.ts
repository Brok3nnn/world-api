import { writeFile } from "node:fs/promises";
import { nodeHttpClient } from "../adapters/node-http-client";
import { createNodeResolveHost } from "../adapters/node-resolve-host";
import { timersWait } from "../adapters/timers-wait";
import { readCommandEnvironment } from "../commands/env";
import { runRecorder } from "./run-recorder";

/** The `record` command: Node's adapters around `runRecorder`. */
process.exitCode = await runRecorder(process.argv.slice(2), {
  environment: () => readCommandEnvironment(),
  egress: { http: nodeHttpClient, resolveHost: createNodeResolveHost(), wait: timersWait },
  write: (file, text) => writeFile(file, text, "utf8"),
  report: (line) => {
    process.stderr.write(`${line}\n`);
  },
});
