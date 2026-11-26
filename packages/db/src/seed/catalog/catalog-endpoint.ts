import type { EndpointDefinition } from "@repo/contracts/endpoint/endpoint-definition";
import type { RecipeDocument } from "@repo/contracts/recipe/recipe";

/** A catalog endpoint of the platform account, written by hand: its definition, recipe and sources. */
export interface CatalogEndpointSeed {
  readonly id: `ep_${string}`;
  readonly definition: EndpointDefinition;
  /** Recipe version 1, active from the start. */
  readonly recipe: RecipeDocument;
  /** The seeded sources it reads, by id. */
  readonly sources: readonly `src_${string}`[];
}
