import type { SourceDefinition } from "@repo/contracts/source/source-definition";

/**
 * One approved source of the registry: a fixed id, so seeding is repeatable, and its
 * definition as checked against the provider's own terms on `policy_checked_at`.
 */
export interface SeedSource {
  readonly id: `src_${string}`;
  readonly definition: SourceDefinition;
}
