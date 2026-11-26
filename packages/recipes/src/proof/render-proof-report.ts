import type { RecipeEvidence } from "./prove-recipes";

/** What a report says about the run beyond its evidence. */
export interface ProofRun {
  readonly evidences: readonly RecipeEvidence[];
  readonly commit: string;
  readonly ranAt: Date;
  readonly passed: boolean;
}

function json(value: unknown): string[] {
  return ["```json", JSON.stringify(value, null, 2), "```"];
}

function section({ golden, outcome, violations, verdict, reason }: RecipeEvidence): string[] {
  const rows = outcome.trace.map(
    (entry) =>
      `| \`${entry.step}\` | \`${entry.kind}\` | ${entry.durationMs} ms | ${entry.bytes} | ${entry.outcome} |`,
  );
  const value = outcome.result.ok
    ? [`As of ${outcome.result.value.asOf.toISOString()}.`, "", ...json(outcome.result.value.data)]
    : ["No value."];
  return [
    `## \`${golden.ref}\``,
    "",
    `Approved hosts: ${golden.hosts.map((host) => `\`${host}\``).join(", ")}. Result: **${verdict}**.`,
    ...(reason === null ? [] : ["", reason]),
    "",
    "### Recipe",
    "",
    ...json(golden.recipe),
    "",
    "### Trace",
    "",
    "| Step | Kind | Duration | Bytes | Outcome |",
    "| --- | --- | --- | --- | --- |",
    ...rows,
    "",
    "### Value",
    "",
    ...value,
    ...(violations.length === 0
      ? []
      : ["", "Output firewall violations:", "", ...json(violations)]),
    "",
  ];
}

/**
 * The report of Proof A, as Markdown. It holds the recipes, their traces and values, and never
 * the user agent, which carries the operator's contact.
 */
export function renderProofReport({ evidences, commit, ranAt, passed }: ProofRun): string {
  return [
    "# Proof A — a recipe yields a valid live value",
    "",
    "| Field | Value |",
    "| --- | --- |",
    "| Command | `pnpm proof:recipe` |",
    `| Commit | \`${commit}\` |`,
    `| Run at | ${ranAt.toISOString()} |`,
    `| Verdict | **${passed ? "PASS" : "FAIL"}** |`,
    "",
    "Each recipe ran against its live sources through the egress policy, with the platform's",
    "user agent, and its value was checked by the output firewall.",
    "",
    ...evidences.flatMap(section),
  ].join("\n");
}
