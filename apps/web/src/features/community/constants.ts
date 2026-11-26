import { HeartIcon, type LucideIcon, PackageCheckIcon, TrophyIcon, UploadIcon } from "lucide-react";
import type { ActivityKind, ApiRequestStatus } from "./types";

export const COMMUNITY_TABS = ["trending", "new", "requests", "publishers"] as const;
export type CommunityTab = (typeof COMMUNITY_TABS)[number];

export const COMMUNITY_TAB_LABELS: Record<CommunityTab, string> = {
  trending: "Trending",
  new: "New",
  requests: "Requests",
  publishers: "Publishers",
};

interface RequestStatusMeta {
  label: string;
  badge: "outline" | "brand" | "success";
}

export const REQUEST_STATUSES: Record<ApiRequestStatus, RequestStatusMeta> = {
  open: { label: "Open", badge: "outline" },
  building: { label: "Building", badge: "brand" },
  shipped: { label: "Shipped", badge: "success" },
};

export const ACTIVITY_ICONS: Record<ActivityKind, LucideIcon> = {
  published: UploadIcon,
  liked: HeartIcon,
  "request-shipped": PackageCheckIcon,
  milestone: TrophyIcon,
};

/** How many endpoints the trending and new tabs show. */
export const TRENDING_LIMIT = 10;
export const NEWEST_LIMIT = 8;
