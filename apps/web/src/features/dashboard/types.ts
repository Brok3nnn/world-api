import type { Visibility } from "@/features/builder/types";
import type { CoverId, EndpointStatus, RefreshInterval } from "@/features/catalog/types";

/** An endpoint the viewer owns, with its owner-only numbers. */
export interface OwnedEndpoint {
  id: string;
  slug: string;
  title: string;
  cover: CoverId;
  status: EndpointStatus;
  visibility: Visibility;
  refresh: RefreshInterval;
  paidCalls30d: number;
  /** 0..1, or null while the endpoint is still being built. */
  uptime: number | null;
}

/** An owned endpoint plus whether it has a public detail page in the catalog. */
export interface OwnedEndpointRow extends OwnedEndpoint {
  listedInCatalog: boolean;
}

export interface BuildInProgress {
  id: string;
  title: string;
  currentStep: string;
  /** 0..1 */
  progress: number;
}

export interface DashboardSummary {
  paidCalls30d: number;
  /** Owned endpoints that are serving calls now. */
  liveEndpoints: number;
  /** Average over endpoints that are serving traffic; null when none are. */
  averageUptime: number | null;
}

export interface DashboardOverview {
  endpoints: OwnedEndpointRow[];
  builds: BuildInProgress[];
  summary: DashboardSummary;
}
