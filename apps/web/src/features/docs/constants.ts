import {
  BracesIcon,
  CoinsIcon,
  LinkIcon,
  PlugIcon,
  RocketIcon,
  TriangleAlertIcon,
} from "lucide-react";
import type { SectionNavItem } from "@/components/shared/section-nav";
import { sampleCreditCosts, siteConfig } from "@/config/site";
import { formatNumber } from "@/lib/format";

export const DOC_SECTIONS: readonly SectionNavItem[] = [
  { id: "quickstart", label: "Quickstart", icon: RocketIcon },
  { id: "parameters", label: "The link", icon: LinkIcon },
  { id: "response", label: "Response", icon: BracesIcon },
  { id: "errors", label: "Errors", icon: TriangleAlertIcon },
  { id: "credits", label: "Credits", icon: CoinsIcon },
  { id: "agents", label: "Agents", icon: PlugIcon },
];

export const QUICKSTART_SNIPPET = [
  `curl "${siteConfig.apiBaseUrl}/get?q=EUR+to+HUF+rate&shape=number" \\`,
  `  -H "Authorization: Bearer $DATA_API_KEY"`,
  "# → 391.42",
].join("\n");

export const PERMANENT_URL_SNIPPET = [
  `curl "${siteConfig.apiBaseUrl}/@core/fx-eur-huf" \\`,
  `  -H "Authorization: Bearer $DATA_API_KEY"`,
].join("\n");

interface ReferenceRow {
  name: string;
  description: string;
}

export const PARAMETERS: readonly ReferenceRow[] = [
  { name: "q", description: "Natural-language question for /get. A catalog hit answers at once." },
  { name: "shape", description: "json (default), number, text, csv or probability." },
  { name: "sources", description: "Comma-separated endpoints to mix into one response." },
  { name: "refresh", description: "Refresh interval for a new mix: 1m, 5m, 15m, 1h or 1d." },
  { name: "ask", description: "Question about the data, answered as a probability." },
  { name: "max_age", description: "Accept cached values at most this many seconds old." },
  { name: "max_price", description: "Cost cap in credits. A pricier answer returns 402 instead." },
  { name: "wait", description: "Seconds to wait for a build to finish instead of getting 202." },
];

export const RESPONSE_EXAMPLE = JSON.stringify(
  {
    data: { birds_visible: 7, confidence: 0.93 },
    as_of: "2026-11-21T11:49:10Z",
    sources: [
      {
        name: "Private trail camera",
        url: "https://example.org/trail-camera",
        licence: "Owner licence",
        attribution: null,
      },
    ],
    next_refresh: "2026-11-21T11:50:10Z",
    method: "model-estimate",
    price_credits: 4,
  },
  null,
  2,
);

export const RESPONSE_FIELDS: readonly ReferenceRow[] = [
  { name: "data", description: "The value, shaped by the endpoint's output schema." },
  { name: "as_of", description: "When the value was observed (ISO 8601, UTC)." },
  {
    name: "sources",
    description:
      "Name, link, licence and required credit of every source the value was built from.",
  },
  { name: "next_refresh", description: "When a fresher value will be available." },
  { name: "method", description: "computed, model-estimate or owner-data." },
  { name: "price_credits", description: "What this call cost. Failed calls cost nothing." },
];

interface ErrorCode {
  status: number;
  name: string;
  action: string;
}

export const ERROR_CODES: readonly ErrorCode[] = [
  {
    status: 202,
    name: "Building",
    action: "Nothing matched, so a build started. Poll the build_id or retry with wait=30.",
  },
  {
    status: 402,
    name: "Payment required",
    action: "The answer costs more than max_price. Raise the cap or leave it out.",
  },
  {
    status: 404,
    name: "Not buildable",
    action: "No permitted or reliable source exists. You are not charged; rephrase the question.",
  },
  {
    status: 429,
    name: "Rate limited",
    action: "Too many calls. Back off for the seconds given in the Retry-After header.",
  },
  {
    status: 503,
    name: "Degraded",
    action:
      "The source changed and the endpoint is self-healing. Not billed; retry or set max_age.",
  },
];

export const CREDIT_PRICES: readonly ReferenceRow[] = [
  {
    name: "Catalog call",
    description: `${sampleCreditCosts.perSourceCall} credit per source (a three-source mix costs 3)`,
  },
  {
    name: "Model answer or estimate",
    description: `${sampleCreditCosts.perModelAnswer} credits`,
  },
  {
    name: "New endpoint build",
    description: `${formatNumber(sampleCreditCosts.newEndpoint[0])}–${formatNumber(sampleCreditCosts.newEndpoint[1])} credits, once. You own the result.`,
  },
  {
    name: "Community endpoints",
    description: "Priced by their publisher, shown on every endpoint page",
  },
];
