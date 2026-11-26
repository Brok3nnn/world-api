// @ts-check
/*
 * Lets Node run the repository's TypeScript as it is (decision 0013). Node strips the types by
 * itself; this hook only adds `.ts` to a relative import written without an extension, as the
 * packages write them for their bundler-style resolution. JSON is imported with its extension
 * and `with { type: "json" }`.
 *
 * Usage: node --import <repository>/scripts/resolve-ts.mjs <file>.ts
 */
import { registerHooks } from "node:module";

/** A last path segment that already names its file type, such as `x.json` or `x.ts`. */
const HAS_EXTENSION = /\.[a-z0-9]+$/i;

registerHooks({
  resolve(specifier, context, nextResolve) {
    const relative = specifier.startsWith("./") || specifier.startsWith("../");
    return nextResolve(
      relative && !HAS_EXTENSION.test(specifier) ? `${specifier}.ts` : specifier,
      context,
    );
  },
});
