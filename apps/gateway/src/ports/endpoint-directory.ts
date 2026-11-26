import type { EndpointPath } from "@repo/contracts/api/endpoint-path";
import type { EndpointDefinition } from "@repo/contracts/endpoint/endpoint-definition";
import type { Recipe } from "@repo/contracts/recipe/recipe-schema";
import type { SourceTier } from "@repo/contracts/source/source-tier";
import type { EndpointId, RecipeVersionId, SourceId } from "@repo/core/ids/id";

/** A source an endpoint reads, with what serving and refreshing a call need to know of it. */
interface ServedSource {
  readonly id: SourceId;
  readonly name: string;
  readonly hosts: readonly string[];
  /** Where the source publishes its data. */
  readonly url: string;
  /** The licence its data is used under, by its short name. */
  readonly licence: string;
  /** The attribution its licence requires, or `null` when it requires none. */
  readonly attribution: string | null;
  readonly tier: SourceTier;
  readonly policyCheckedAt: Date;
  readonly rateLimitPerMin: number;
}

/** Everything the gateway needs to serve one endpoint. */
export interface ServedEndpoint {
  readonly id: EndpointId;
  readonly definition: EndpointDefinition;
  /** The active recipe, or `null` while the endpoint has none. */
  readonly recipe: { readonly id: RecipeVersionId; readonly document: Recipe } | null;
  readonly sources: readonly ServedSource[];
}

/** Finds an endpoint by its owner and slug. */
export interface EndpointDirectory {
  find(path: EndpointPath): Promise<ServedEndpoint | null>;
}
