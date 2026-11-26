import {
  BirdIcon,
  BookOpenTextIcon,
  BriefcaseIcon,
  CloudSunIcon,
  CodeXmlIcon,
  type LucideIcon,
  MapPinIcon,
  ShoppingBasketIcon,
  TrainFrontIcon,
  TrendingUpIcon,
  WindIcon,
  ZapIcon,
} from "lucide-react";
import { keysOf } from "@/lib/object";
import type {
  CategoryId,
  Compliance,
  CoverId,
  EndpointSort,
  EndpointStatus,
  RefreshInterval,
  ResponseMethod,
  Shape,
} from "./types";

interface CategoryMeta {
  label: string;
  icon: LucideIcon;
}

export const CATEGORIES: Record<CategoryId, CategoryMeta> = {
  weather: { label: "Weather", icon: CloudSunIcon },
  environment: { label: "Environment", icon: WindIcon },
  wildlife: { label: "Wildlife", icon: BirdIcon },
  finance: { label: "Finance", icon: TrendingUpIcon },
  energy: { label: "Energy", icon: ZapIcon },
  transport: { label: "Transport", icon: TrainFrontIcon },
  developer: { label: "Developer", icon: CodeXmlIcon },
  knowledge: { label: "Knowledge", icon: BookOpenTextIcon },
  places: { label: "Places", icon: MapPinIcon },
  commerce: { label: "Commerce", icon: ShoppingBasketIcon },
  jobs: { label: "Jobs", icon: BriefcaseIcon },
};

export const CATEGORY_IDS = keysOf(CATEGORIES);

/** Cover used when an endpoint has no artwork of its own yet (for example a fresh build). */
export const CATEGORY_COVERS: Record<CategoryId, CoverId> = {
  weather: "sky",
  environment: "hills",
  wildlife: "forest",
  finance: "coins",
  energy: "bolt",
  transport: "city",
  developer: "code",
  knowledge: "book",
  places: "map",
  commerce: "shop",
  jobs: "desk",
};

interface ShapeMeta {
  label: string;
  description: string;
}

export const SHAPES: Record<Shape, ShapeMeta> = {
  json: { label: "JSON", description: "Value, time and sources" },
  number: { label: "Number", description: "Just the number" },
  text: { label: "Sentence", description: "One readable sentence" },
  csv: { label: "Table", description: "Rows for a spreadsheet" },
  probability: { label: "Chance", description: "How likely, from 0 to 100%" },
};

export const SHAPE_IDS = keysOf(SHAPES);

export const REFRESH_INTERVALS: Record<RefreshInterval, { label: string; seconds: number }> = {
  "1m": { label: "Every minute", seconds: 60 },
  "5m": { label: "Every 5 min", seconds: 300 },
  "15m": { label: "Every 15 min", seconds: 900 },
  "1h": { label: "Hourly", seconds: 3_600 },
  "1d": { label: "Daily", seconds: 86_400 },
};

export const REFRESH_INTERVAL_IDS = keysOf(REFRESH_INTERVALS);

export const RESPONSE_METHODS: Record<ResponseMethod, string> = {
  computed: "Computed",
  "model-estimate": "Model estimate",
  "owner-data": "Owner data",
};

export const COMPLIANCE_LABELS: Record<Compliance, string> = {
  green: "Cleared",
  yellow: "Conditional",
  red: "Blocked",
};

export const STATUS_LABELS: Record<EndpointStatus, string> = {
  live: "Live",
  degraded: "Degraded",
  building: "Building",
};

export const SORT_OPTIONS: Record<EndpointSort, string> = {
  popular: "Most called",
  liked: "Most liked",
  trending: "Trending",
  newest: "Newest",
};

export const SORT_IDS = keysOf(SORT_OPTIONS);
