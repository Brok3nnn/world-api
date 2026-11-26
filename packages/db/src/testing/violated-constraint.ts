function constraintOf(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }
  if ("constraint" in error && typeof error.constraint === "string") {
    return error.constraint;
  }
  return "cause" in error ? constraintOf(error.cause) : undefined;
}

/**
 * Runs a write that is expected to break a database constraint and returns the constraint's
 * name, so a test can assert which rule the database enforced. `undefined` when the write
 * succeeded or failed for another reason.
 */
export async function violatedConstraint(write: PromiseLike<unknown>): Promise<string | undefined> {
  try {
    await write;
    return undefined;
  } catch (error) {
    return constraintOf(error);
  }
}
