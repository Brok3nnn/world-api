"use client";

import { LinkIcon } from "lucide-react";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { endpointApiUrl } from "@/features/catalog/lib/endpoint-urls";
import { CONNECTION_METHOD_IDS, CONNECTION_METHODS } from "../constants";
import { slugify } from "../lib/slugify";
import type { PublishStepProps } from "../types";
import { CategorySelect } from "./category-select";
import { OptionCardRadioGroup } from "./option-card-radio-group";
import { PublishConnectionInput } from "./publish-connection-input";

interface PublishSourceStepProps extends PublishStepProps {
  publisherHandle: string;
}

const CONNECTION_CARDS = CONNECTION_METHOD_IDS.map((method) => ({
  value: method,
  ...CONNECTION_METHODS[method],
}));

/** Step 1: how the data reaches the platform, and what the API is called. */
export function PublishSourceStep({
  draft,
  errors,
  onChange,
  publisherHandle,
}: PublishSourceStepProps) {
  const previewUrl = endpointApiUrl({ publisherHandle, slug: slugify(draft.name) });

  return (
    <div className="flex flex-col gap-5">
      <OptionCardRadioGroup
        name="How the data arrives"
        idPrefix="publish-connection"
        value={draft.connection}
        options={CONNECTION_CARDS}
        onValueChange={(connection) => onChange({ connection })}
        size="lg"
        className="sm:grid-cols-2"
      />

      <PublishConnectionInput draft={draft} errors={errors} onChange={onChange} />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField
          id="publish-name"
          label="Name"
          hint={
            <span className="flex min-w-0 items-center gap-1">
              <LinkIcon aria-hidden className="size-3 shrink-0" />
              <span className="truncate">{previewUrl}</span>
            </span>
          }
          error={errors.name}
          className="min-w-0"
        >
          {(control) => (
            <Input
              {...control}
              value={draft.name}
              onChange={(event) => onChange({ name: event.target.value })}
              placeholder="Forest camera 12"
              maxLength={80}
              className="h-9"
            />
          )}
        </FormField>

        <FormField id="publish-category" label="Category" error={errors.category}>
          {(control) => (
            <CategorySelect
              {...control}
              value={draft.category}
              onValueChange={(category) => onChange({ category })}
            />
          )}
        </FormField>
      </div>
    </div>
  );
}
