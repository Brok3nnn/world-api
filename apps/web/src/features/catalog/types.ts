/** Output shapes every endpoint can be asked for via `?shape=`. */
export type Shape = "json" | "number" | "text" | "csv" | "probability";

/** Freshness classes. An endpoint never refreshes faster than its class. */
export type RefreshInterval = "1m" | "5m" | "15m" | "1h" | "1d";

export type CategoryId =
  | "weather"
  | "environment"
  | "wildlife"
  | "finance"
  | "energy"
  | "transport"
  | "developer"
  | "knowledge"
  | "places"
  | "commerce"
  | "jobs";

/** Cover photo, served from `/covers/<id>.jpg`. */
export type CoverId =
  | "sky"
  | "rain"
  | "hills"
  | "water"
  | "mountain"
  | "field"
  | "city"
  | "forest"
  | "hive"
  | "coins"
  | "bolt"
  | "code"
  | "book"
  | "map"
  | "shop"
  | "desk"
  | "token"
  | "news"
  | "package"
  | "transit"
  | "sunrise"
  | "parking";

/** The three supply layers of the catalog. */
type SupplyLayer = "catalog" | "on-demand" | "own-data";

type SourceKind = "open-data" | "website" | "sensor" | "camera" | "dataset" | "partner-api" | "mix";

/** Disclosed on every response (`method` field) for transparency. */
export type ResponseMethod = "computed" | "model-estimate" | "owner-data";

/** Legal traffic light assigned to every source. Red sources are never built. */
export type Compliance = "green" | "yellow" | "red";

export type EndpointStatus = "live" | "degraded" | "building";

export interface Publisher {
  handle: string;
  displayName: string;
  kind: "platform" | "community";
  verified: boolean;
  bio: string;
  joinedAt: string;
}

interface DataSource {
  name: string;
  license: string;
  compliance: Compliance;
}

interface EndpointStats {
  likes: number;
  paidCalls30d: number;
  /** Relative change of paid calls versus the previous 30 days, e.g. 0.12 = +12%. */
  callsTrend: number;
  /** 0..1 */
  uptime: number;
  latencyP50Ms: number;
  /** Brier-style calibration score (0..1) for probability endpoints. */
  calibration?: number;
}

export interface EndpointSample {
  data: Record<string, unknown>;
  number?: number;
  text: string;
  csv: string;
  probability?: {
    question: string;
    value: number;
  };
}

/** What a widget shows at a glance: the current value in human terms. */
export interface EndpointPreview {
  value: string;
  /** Unit or noun after the value, e.g. "°C" or "birds". */
  unit?: string;
  /** Short context, e.g. "Vienna · now". */
  caption: string;
}

export interface Endpoint {
  id: string;
  slug: string;
  publisherHandle: string;
  title: string;
  summary: string;
  description: string;
  category: CategoryId;
  layer: SupplyLayer;
  sourceKind: SourceKind;
  sources: DataSource[];
  shapes: Shape[];
  refresh: RefreshInterval;
  priceCredits: number;
  method: ResponseMethod;
  status: EndpointStatus;
  stats: EndpointStats;
  sample: EndpointSample;
  preview: EndpointPreview;
  cover: CoverId;
  tags: string[];
  publishedAt: string;
  asOf: string;
}

/** Minimal endpoint data for client-side lists such as the command menu. */
export type EndpointSummary = Pick<
  Endpoint,
  | "id"
  | "title"
  | "summary"
  | "publisherHandle"
  | "slug"
  | "category"
  | "tags"
  | "cover"
  | "preview"
>;

export type EndpointSort = "popular" | "liked" | "newest" | "trending";
