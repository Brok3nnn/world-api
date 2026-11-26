/**
 * The outcome of an operation that can fail in a way its caller must handle. Check `ok` to
 * narrow: a success carries `value`, a failure carries `error`.
 */
export type Result<Value, Failure> =
  | { readonly ok: true; readonly value: Value }
  | { readonly ok: false; readonly error: Failure };

export function ok<Value>(value: Value): Result<Value, never> {
  return { ok: true, value };
}

export function err<Failure>(error: Failure): Result<never, Failure> {
  return { ok: false, error };
}
