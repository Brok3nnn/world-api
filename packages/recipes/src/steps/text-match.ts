import { err, ok, type Result } from "@repo/core/result";
import { RE2JS } from "re2js";
import type { JsonValue } from "../engine/json-value";
import type { StepFailure } from "../engine/run-failure";
import { RUN_LIMITS } from "../engine/run-limits";
import type { StepExecutor } from "../engine/step-executor";

/** The engine flag of each recipe flag. Patterns are always read as Unicode, so `u` adds none. */
const FLAGS: Readonly<Record<string, number>> = {
  i: RE2JS.CASE_INSENSITIVE,
  m: RE2JS.MULTILINE,
  s: RE2JS.DOTALL,
  u: 0,
};

/**
 * The compiled pattern, or `null` when it cannot be read or uses what a linear-time engine does
 * not offer, such as back-references. The engine reports both only by throwing.
 */
function compile(pattern: string, flags: string): RE2JS | null {
  const engineFlags = [...flags].reduce((all, flag) => all | (FLAGS[flag] ?? 0), 0);
  try {
    return RE2JS.compile(pattern, engineFlags);
  } catch {
    return null;
  }
}

/** The groups of a match: by name when the pattern names them, else in order, else the match. */
function groupsOf(pattern: RE2JS, input: string): Result<JsonValue, StepFailure> {
  const matcher = pattern.matcher(input);
  if (!matcher.find()) {
    return err({ code: "pattern_no_match" });
  }
  const named = Object.entries(pattern.namedGroups());
  if (named.length > 0) {
    return ok(Object.fromEntries(named.map(([name, index]) => [name, matcher.group(index)])));
  }
  const numbered = Array.from({ length: pattern.groupCount() }, (_, index) =>
    matcher.group(index + 1),
  );
  return ok(numbered.length > 0 ? numbered : matcher.group());
}

/**
 * Captures groups from a text result with a pattern in RE2 syntax, on an engine that runs in
 * linear time, so no pattern can backtrack without end (decision 0012). A pattern the engine
 * cannot use matches nothing; text longer than one fetch may return is refused.
 */
export const textMatch: StepExecutor<"text.match"> = async (step, { results }) => {
  const input = results.get(step.from);
  if (typeof input !== "string") {
    return err({ code: "unexpected_content" });
  }
  if (input.length > RUN_LIMITS.matchInputChars) {
    return err({ code: "limit_exceeded" });
  }
  const pattern = compile(step.pattern, step.flags ?? "");
  if (pattern === null) {
    return err({ code: "pattern_no_match" });
  }
  const groups = groupsOf(pattern, input);
  return groups.ok ? ok({ value: groups.value }) : groups;
};
