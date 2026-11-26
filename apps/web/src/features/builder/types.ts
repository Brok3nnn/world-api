import type { CategoryId, RefreshInterval } from "@/features/catalog/types";
import type { BuilderParams } from "./search-params";

/** What a requester asks the builder for: a sentence plus the three composer settings. */
export type BuildRequest = Omit<BuilderParams, "mode">;

export type Visibility = "private" | "unlisted" | "public";

export type SchemaFieldType = "number" | "string" | "boolean";

/** One output field of a custom schema or a publisher's response rule. */
export interface SchemaField {
  id: string;
  name: string;
  type: SchemaFieldType;
}

export type BuildStepId =
  | "source-search"
  | "legal-filter"
  | "recipe"
  | "sandbox"
  | "schema"
  | "publish";

export type BuildStepStatus = "pending" | "running" | "done";

/** Everything the builder agent needs to start, captured when the requester submits. */
export interface BuildJob {
  request: BuildRequest;
  visibility: Visibility;
  maxPriceCredits: number;
  fields: SchemaField[];
  /** ISO timestamp captured in the submit handler, never during render. */
  startedAt: string;
}

/** How a publisher's own source reaches the platform. */
export type ConnectionMethod = "push" | "pull" | "file" | "api-key";

export interface PublishDraft {
  name: string;
  category: CategoryId | null;
  connection: ConnectionMethod;
  sourceUrl: string;
  apiKey: string;
  fileName: string;
  responseRule: string;
  fields: SchemaField[];
  priceCredits: number;
  refresh: RefreshInterval;
  hasResaleRights: boolean;
  noPersonalData: boolean;
}

export type PublishDraftErrors = Partial<Record<keyof PublishDraft, string>>;

/** The steps of the "share your data" wizard, in order. */
export type PublishStepId = "source" | "response" | "price" | "review";

/** Contract shared by every step of the publish wizard. */
export interface PublishStepProps {
  draft: PublishDraft;
  errors: PublishDraftErrors;
  onChange: (patch: Partial<PublishDraft>) => void;
}
