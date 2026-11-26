import { FRANKFURT_REPORT_FILE } from "./frankfurt-report-file";
import { FRANKFURT_WEATHER } from "./frankfurt-weather";
import type { GoldenRecipe } from "./golden-recipe";
import { TOPEKA_WEATHER } from "./topeka-weather";
import { TREASURY_INTEREST_RATES } from "./treasury-interest-rates";
import { WEATHER_DIFFERENCE } from "./weather-difference";

/** Every golden recipe. Together they use every step kind, and one of them is a mix. */
export const GOLDEN_RECIPES: readonly GoldenRecipe[] = [
  TOPEKA_WEATHER,
  FRANKFURT_WEATHER,
  TREASURY_INTEREST_RATES,
  FRANKFURT_REPORT_FILE,
  WEATHER_DIFFERENCE,
];
