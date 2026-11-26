import { z } from "zod";

/** Where a source can reach the platform's owner: an `https` page or an email address. */
export const userAgentContactSchema = z.union([z.url({ protocol: /^https$/ }), z.email()]);

/**
 * The user agent every source sees: what is asking, and whom to contact about it. The product
 * has no name yet, so it names the engine; the contact is the operator's, from configuration.
 */
export function userAgentFor(contact: string): string {
  return `recipe-engine/1 (+${contact})`;
}
