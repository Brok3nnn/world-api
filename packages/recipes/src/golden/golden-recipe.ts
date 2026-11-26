import type { OutputSpec } from "@repo/contracts/endpoint/output-spec";
import type { Recipe } from "@repo/contracts/recipe/recipe-schema";
import type { EndpointData } from "../ports/endpoint-reader";
import type { Recording } from "../recording/recording";

/** A hand-written recipe over approved sources, its recordings and the value it must yield. */
export interface GoldenRecipe {
  readonly ref: string;
  readonly recipe: Recipe;
  readonly outputSpec: OutputSpec;
  /** The hosts of the approved sources it reads; the egress policy allows these and no other. */
  readonly hosts: readonly string[];
  readonly recordings: readonly Recording[];
  /** The values of the endpoints a mix reads. */
  readonly endpoints: Readonly<Record<string, EndpointData>>;
  /** What a run over the recordings must yield. */
  readonly expected: { readonly data: EndpointData; readonly asOf: string };
}

/** When the recordings were made; a recipe that says nothing else was observed then. */
export const RECORDED_AT = "2026-11-22T21:07:00.000Z";
