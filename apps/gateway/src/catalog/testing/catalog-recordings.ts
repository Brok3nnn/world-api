import { GOLDEN_RECIPES } from "@repo/recipes/golden/golden-recipes";
import type { Recording } from "@repo/recipes/recording/recording";
import KEV from "../recordings/known-exploited-vulnerabilities.json" with { type: "json" };
import NANTERRE from "../recordings/nanterre-address.json" with { type: "json" };

/**
 * Live responses of every catalog source, recorded through the egress policy: the golden
 * recipes' and the catalog's own. The vulnerability catalog keeps only its first 25 rows, cut
 * at a row boundary, so the repository stays small.
 */
export const CATALOG_RECORDINGS: readonly Recording[] = [
  ...GOLDEN_RECIPES.flatMap((golden) => golden.recordings),
  NANTERRE,
  KEV,
];
