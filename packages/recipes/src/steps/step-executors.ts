import type { StepExecutors } from "../engine/step-executor";
import { endpointRead } from "./endpoint-read";
import { htmlSelect } from "./html-select";
import { httpGet } from "./http-get";
import { textMatch } from "./text-match";
import { transform } from "./transform";

/** The executor of every step kind of recipe version 1: what a real run passes to `runRecipe`. */
export const STEP_EXECUTORS: StepExecutors = {
  "http.get": httpGet,
  transform,
  "html.select": htmlSelect,
  "text.match": textMatch,
  "endpoint.read": endpointRead,
};
