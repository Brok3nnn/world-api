import { CATEGORY_COVERS } from "@/features/catalog/constants";
import type { Endpoint, EndpointPreview, EndpointSample, Shape } from "@/features/catalog/types";
import type { BuildJob } from "../types";
import { estimateCallCredits } from "./estimate-call-credits";
import { inferCategory } from "./infer-category";
import { resolveSourceCount } from "./resolve-source-count";
import { sampleFromFields } from "./sample-field-values";
import { slugify } from "./slugify";

const SAMPLE_NUMBER = 42;
const SAMPLE_PROBABILITY = 0.62;
const MAX_TITLE_LENGTH = 80;

const SAMPLE_SOURCE_NAMES = [
  "Open data portal",
  "Public statistics office",
  "Permitted public website",
  "Government open feed",
  "Research data repository",
] as const;

/**
 * The endpoint a finished build produces, shaped exactly like a catalog endpoint so the result
 * card can reuse the catalog's URL, response preview and integration prompt helpers.
 */
export function createDraftEndpoint(job: BuildJob, publisherHandle: string): Endpoint {
  const { request } = job;
  const slug = slugify(request.q);
  const sourceCount = resolveSourceCount(request.sources);
  const category = inferCategory(request.q);

  return {
    id: `draft_${slug}`,
    slug,
    publisherHandle,
    title: toTitle(request.q),
    summary: request.q,
    description: request.q,
    category,
    layer: "on-demand",
    sourceKind: sourceCount > 1 ? "mix" : "open-data",
    sources: SAMPLE_SOURCE_NAMES.slice(0, sourceCount).map((name) => ({
      name,
      license: "Open licence",
      compliance: "green",
    })),
    shapes: shapesFor(job),
    refresh: request.refresh,
    priceCredits: estimateCallCredits(request).max,
    method: request.shape === "probability" ? "model-estimate" : "computed",
    status: "live",
    stats: { likes: 0, paidCalls30d: 0, callsTrend: 0, uptime: 1, latencyP50Ms: 0 },
    sample: sampleFor(job),
    preview: previewFor(job),
    cover: CATEGORY_COVERS[category],
    tags: [],
    publishedAt: job.startedAt,
    asOf: job.startedAt,
  };
}

function shapesFor(job: BuildJob): Shape[] {
  switch (job.request.shape) {
    case "custom":
      return ["json", "csv"];
    case "probability":
      return ["json", "number", "text", "probability"];
    default:
      return ["json", "number", "text", "csv"];
  }
}

function sampleFor(job: BuildJob): EndpointSample {
  const data =
    job.request.shape === "custom" ? sampleFromFields(job.fields) : { value: SAMPLE_NUMBER };
  const header = Object.keys(data).join(",");
  const row = Object.values(data).map(String).join(",");

  return {
    data,
    number: job.request.shape === "probability" ? SAMPLE_PROBABILITY : SAMPLE_NUMBER,
    text: `The latest value for “${job.request.q}” is ${SAMPLE_NUMBER}.`,
    csv: `as_of,${header}\n${job.startedAt},${row}`,
    probability:
      job.request.shape === "probability"
        ? { question: job.request.q, value: SAMPLE_PROBABILITY }
        : undefined,
  };
}

function previewFor(job: BuildJob): EndpointPreview {
  return job.request.shape === "probability"
    ? { value: String(SAMPLE_PROBABILITY * 100), unit: "%", caption: "First reading" }
    : { value: String(SAMPLE_NUMBER), caption: "First reading" };
}

function toTitle(request: string): string {
  const trimmed = request.trim().replace(/[?.!]+$/, "");
  const title = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return title.length > MAX_TITLE_LENGTH ? `${title.slice(0, MAX_TITLE_LENGTH - 1)}…` : title;
}
