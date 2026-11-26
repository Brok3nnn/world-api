"use client";

import { CoinsIcon, ListChecksIcon, type LucideIcon, RefreshCwIcon, TagIcon } from "lucide-react";
import { CATEGORIES, REFRESH_INTERVALS } from "@/features/catalog/constants";
import { formatCredits } from "@/lib/format";
import { CONNECTION_METHODS } from "../constants";
import type { PublishStepProps } from "../types";
import { IngestCallDetails } from "./ingest-call-details";
import { PublishRightsChecklist } from "./publish-rights-checklist";

interface PublishReviewStepProps extends PublishStepProps {
  publisherHandle: string;
}

interface SummaryRow {
  label: string;
  value: string;
  icon: LucideIcon;
}

/** Step 4: everything entered so far as compact rows, then the rights to confirm. */
export function PublishReviewStep({
  draft,
  errors,
  onChange,
  publisherHandle,
}: PublishReviewStepProps) {
  const connection = CONNECTION_METHODS[draft.connection];
  const category = draft.category ? CATEGORIES[draft.category] : null;

  const rows: SummaryRow[] = [
    { label: "Name", value: draft.name.trim(), icon: TagIcon },
    { label: "Source", value: connection.label, icon: connection.icon },
    { label: "Category", value: category?.label ?? "None", icon: category?.icon ?? TagIcon },
    {
      label: "Returns",
      value: draft.fields.map((field) => field.name).join(", "),
      icon: ListChecksIcon,
    },
    { label: "Price", value: `${formatCredits(draft.priceCredits)} / call`, icon: CoinsIcon },
    {
      label: "Updates",
      value: REFRESH_INTERVALS[draft.refresh].label,
      icon: RefreshCwIcon,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <dl className="flex flex-col divide-y rounded-xl border">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <div key={row.label} className="flex items-center gap-3 px-4 py-3">
              <dt className="flex shrink-0 items-center gap-2 text-muted-foreground text-sm">
                <Icon aria-hidden className="size-4" />
                {row.label}
              </dt>
              <dd className="ml-auto min-w-0 truncate text-right font-medium text-ink-950 text-sm tabular-nums">
                {row.value}
              </dd>
            </div>
          );
        })}
      </dl>

      {draft.connection === "push" ? (
        <IngestCallDetails draft={draft} publisherHandle={publisherHandle} />
      ) : null}

      <PublishRightsChecklist draft={draft} errors={errors} onChange={onChange} />
    </div>
  );
}
