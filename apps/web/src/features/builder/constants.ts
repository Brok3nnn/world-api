import {
  BirdIcon,
  BracesIcon,
  ClipboardCheckIcon,
  CloudRainIcon,
  CodeXmlIcon,
  CoinsIcon,
  DownloadIcon,
  FileSpreadsheetIcon,
  FlaskConicalIcon,
  GlobeIcon,
  KeyRoundIcon,
  LinkIcon,
  ListChecksIcon,
  LockIcon,
  type LucideIcon,
  PlugIcon,
  RadioTowerIcon,
  RocketIcon,
  ScaleIcon,
  SearchIcon,
  SunriseIcon,
  WavesIcon,
} from "lucide-react";
import { SHAPE_IDS } from "@/features/catalog/constants";
import type { CategoryId, Shape } from "@/features/catalog/types";
import { keysOf } from "@/lib/object";
import type {
  BuildRequest,
  BuildStepId,
  ConnectionMethod,
  PublishDraft,
  PublishStepId,
  SchemaField,
  SchemaFieldType,
  Visibility,
} from "./types";

/** How many sources the builder may blend into one response. */
export const SOURCE_MIX_OPTIONS = ["auto", "1", "2", "3", "5"] as const;
export type SourceMix = (typeof SOURCE_MIX_OPTIONS)[number];

export const SOURCE_MIX_LABELS: Record<SourceMix, string> = {
  auto: "Any source",
  "1": "1 source",
  "2": "Mix 2",
  "3": "Mix 3",
  "5": "Mix up to 5",
};

/** Shapes a requester can ask for. `custom` lets them define the exact fields. */
export type RequestedShape = Shape | "custom";

export const REQUESTED_SHAPES: readonly RequestedShape[] = [...SHAPE_IDS, "custom"];

export const BUILDER_MODES = ["request", "publish"] as const;

export const DEFAULT_BUILD_REQUEST = {
  q: "",
  sources: "auto",
  shape: "json",
  refresh: "15m",
} as const satisfies BuildRequest;

interface ExampleRequest {
  label: string;
  icon: LucideIcon;
  request: BuildRequest;
}

/** Example requests cycled as the composer placeholder while it is empty. */
export const COMPOSER_PLACEHOLDERS = [
  "I need an API for the free spots in my car park",
  "Air quality on my street, refreshed every minute",
  "Is oat milk in stock at the corner shop?",
  "Will the Danube rise above 400 cm this week?",
] as const;

/** Starter prompts shown under the composer. Each one exercises a different composer setting. */
export const EXAMPLE_REQUESTS: readonly ExampleRequest[] = [
  {
    label: "Birds on camera",
    icon: BirdIcon,
    request: {
      q: "How many birds are visible on my forest camera right now",
      sources: "1",
      shape: "number",
      refresh: "1m",
    },
  },
  {
    label: "Morning brief",
    icon: SunriseIcon,
    request: {
      q: "Vienna weather, the EUR/HUF rate and the top tech story in one JSON",
      sources: "3",
      shape: "json",
      refresh: "15m",
    },
  },
  {
    label: "Rain next hour",
    icon: CloudRainIcon,
    request: {
      q: "Will it rain in Budapest in the next 60 minutes?",
      sources: "auto",
      shape: "probability",
      refresh: "5m",
    },
  },
  {
    label: "River level",
    icon: WavesIcon,
    request: {
      q: "Danube water level in Budapest, in centimetres",
      sources: "1",
      shape: "number",
      refresh: "15m",
    },
  },
];

interface OptionMeta {
  label: string;
  /** One short line shown under the label. */
  description: string;
  icon: LucideIcon;
}

export const VISIBILITY_OPTIONS: Record<Visibility, OptionMeta> = {
  private: { label: "Private", description: "Only your keys can call it.", icon: LockIcon },
  unlisted: { label: "Unlisted", description: "Anyone with the link.", icon: LinkIcon },
  public: { label: "Public", description: "Listed after review.", icon: GlobeIcon },
};

export const VISIBILITY_IDS = keysOf(VISIBILITY_OPTIONS);

export const SCHEMA_FIELD_TYPES: Record<SchemaFieldType, string> = {
  number: "Number",
  string: "Text",
  boolean: "Yes / no",
};

export const SCHEMA_FIELD_TYPE_IDS = keysOf(SCHEMA_FIELD_TYPES);

export const DEFAULT_SCHEMA_FIELDS: readonly SchemaField[] = [
  { id: "field-value", name: "value", type: "number" },
];

export const DEFAULT_MAX_PRICE_CREDITS = 20;

/** The builder agent pipeline, in order. */
export const BUILD_STEPS: readonly { id: BuildStepId; title: string; icon: LucideIcon }[] = [
  { id: "source-search", title: "Find sources", icon: SearchIcon },
  { id: "legal-filter", title: "Check licences", icon: ScaleIcon },
  { id: "recipe", title: "Write the code", icon: CodeXmlIcon },
  { id: "sandbox", title: "Run tests", icon: FlaskConicalIcon },
  { id: "schema", title: "Set format and updates", icon: BracesIcon },
  { id: "publish", title: "Go live", icon: RocketIcon },
];

export const BUILD_STEP_DURATION_MS = 1_100;
export const BUILD_STEP_DURATION_REDUCED_MS = 150;

/** Keyword hints used to file a requested endpoint under a catalog category. */
export const CATEGORY_KEYWORDS: readonly { category: CategoryId; keywords: readonly string[] }[] = [
  { category: "weather", keywords: ["weather", "rain", "temperature", "wind", "snow", "forecast"] },
  {
    category: "environment",
    keywords: ["air", "pm2.5", "pollution", "river", "water", "soil", "noise"],
  },
  { category: "wildlife", keywords: ["bird", "animal", "bee", "hive", "wildlife", "camera"] },
  { category: "finance", keywords: ["rate", "eur", "usd", "huf", "exchange", "crypto", "bitcoin"] },
  { category: "energy", keywords: ["power", "electricity", "energy", "solar", "grid"] },
  {
    category: "transport",
    keywords: ["parking", "car park", "transit", "train", "tram", "bus", "traffic", "delay"],
  },
  { category: "developer", keywords: ["repository", "package", "downloads", "stars", "code"] },
  { category: "places", keywords: ["address", "coordinates", "map", "location", "geocode"] },
  { category: "commerce", keywords: ["stock", "shop", "inventory", "store", "product"] },
  { category: "jobs", keywords: ["job", "hiring", "role", "vacancy"] },
];

export const CONNECTION_METHODS: Record<ConnectionMethod, OptionMeta> = {
  push: {
    label: "Push from a device",
    description: "Your device sends values. Cheapest and safest.",
    icon: RadioTowerIcon,
  },
  pull: {
    label: "Pull from a URL",
    description: "We fetch it when an update is due.",
    icon: DownloadIcon,
  },
  file: {
    label: "File or sheet",
    description: "Upload a CSV, JSON or spreadsheet.",
    icon: FileSpreadsheetIcon,
  },
  "api-key": {
    label: "Existing API key",
    description: "Stored encrypted. Only allowed fields pass.",
    icon: KeyRoundIcon,
  },
};

export const CONNECTION_METHOD_IDS = keysOf(CONNECTION_METHODS);

/** The "share your data" wizard: short label for the stepper, title for the step heading. */
export const PUBLISH_STEPS: Record<
  PublishStepId,
  { label: string; title: string; icon: LucideIcon }
> = {
  source: { label: "Source", title: "Connect your source", icon: PlugIcon },
  response: { label: "What it returns", title: "What it returns", icon: ListChecksIcon },
  price: { label: "Price", title: "Set your price", icon: CoinsIcon },
  review: { label: "Review", title: "Review and submit", icon: ClipboardCheckIcon },
};

export const PUBLISH_STEP_IDS = keysOf(PUBLISH_STEPS);

export const EMPTY_PUBLISH_DRAFT: PublishDraft = {
  name: "",
  category: null,
  connection: "push",
  sourceUrl: "",
  apiKey: "",
  fileName: "",
  responseRule: "",
  fields: [...DEFAULT_SCHEMA_FIELDS],
  priceCredits: 2,
  refresh: "15m",
  hasResaleRights: false,
  noPersonalData: false,
};
