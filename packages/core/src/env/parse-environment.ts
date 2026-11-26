interface EnvironmentIssue {
  readonly path: readonly PropertyKey[];
  readonly message: string;
}

/**
 * The part of a schema this function uses. Every object schema of the schema library has it,
 * so an app passes its schema directly and this package needs no dependency on the library.
 */
interface EnvironmentSchema<Environment> {
  safeParse(
    input: unknown,
  ):
    | { readonly success: true; readonly data: Environment }
    | { readonly success: false; readonly error: { readonly issues: readonly EnvironmentIssue[] } };
}

/** Raw configuration as the platform provides it: names to text, or nothing. */
type EnvironmentSource = Readonly<Record<string, string | undefined>>;

/**
 * Parses configuration once, at start-up, in the single `env.ts` of an app. Returns a frozen,
 * typed object, or throws an error that names every variable that is missing or malformed.
 * The message never contains a value, so a wrong secret cannot leak into logs.
 */
export function parseEnvironment<Environment extends object>(
  schema: EnvironmentSchema<Environment>,
  source: EnvironmentSource,
): Readonly<Environment> {
  const parsed = schema.safeParse(source);
  if (parsed.success) {
    return Object.freeze(parsed.data);
  }
  const names = parsed.error.issues.map((issue) => String(issue.path[0] ?? "environment"));
  const unique = [...new Set(names)].sort();
  throw new Error(`Invalid configuration. Check these variables: ${unique.join(", ")}.`);
}
