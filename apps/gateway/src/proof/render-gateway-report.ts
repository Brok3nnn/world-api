import type { Demonstration, Exchange, Verdict } from "./proof-world";

/** What a report says about the run beyond its demonstrations. */
export interface GatewayProofRun {
  readonly demonstrations: readonly Demonstration[];
  readonly commit: string;
  readonly ranAt: Date;
  readonly verdict: Verdict;
}

/** The longest body a report row shows; the rest is cut. */
const BODY_EXCERPT = 160;

/** A body on one table row: no line breaks or pipes, cut to the excerpt length. */
function excerpt(body: string): string {
  const flat = body.replaceAll(/\r?\n/g, " ↵ ").replaceAll("|", "\\|");
  return flat.length > BODY_EXCERPT ? `${flat.slice(0, BODY_EXCERPT)}…` : flat;
}

function row({ path, status, contentType, retryAfter, body }: Exchange): string {
  const retry = retryAfter === null ? "" : `, retry after ${retryAfter} s`;
  return `| \`${path}\` | ${status}${retry} | ${contentType ?? "—"} | \`${excerpt(body)}\` |`;
}

function section({ title, verdict, findings, exchanges }: Demonstration): string[] {
  return [
    `## ${title}`,
    "",
    `Result: **${verdict}**.`,
    "",
    ...findings.map((finding) => `- ${finding}`),
    "",
    "| Request | Status | Content type | Body |",
    "| --- | --- | --- | --- |",
    ...exchanges.map(row),
    "",
  ];
}

/**
 * The report of Proof B, as Markdown: every request the proof made and what came back. It never
 * holds the user agent, which carries the operator's contact.
 */
export function renderGatewayReport({
  demonstrations,
  commit,
  ranAt,
  verdict,
}: GatewayProofRun): string {
  return [
    "# Proof B — the gateway serves, refreshes and degrades correctly",
    "",
    "| Field | Value |",
    "| --- | --- |",
    "| Command | `pnpm proof:gateway` |",
    `| Commit | \`${commit}\` |`,
    `| Run at | ${ranAt.toISOString()} |`,
    `| Verdict | **${verdict === "pass" ? "PASS" : "FAIL"}** |`,
    "",
    "The gateway ran in this process on a migrated, seeded in-process database, with live",
    "sources behind the egress policy. The proof moved its clock and made one source host fail.",
    "",
    ...demonstrations.flatMap(section),
  ].join("\n");
}
