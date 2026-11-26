"use client";

import { ChevronDownIcon, SlidersHorizontalIcon } from "lucide-react";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { formatCredits } from "@/lib/format";
import { VISIBILITY_IDS, VISIBILITY_OPTIONS } from "../constants";
import type { SchemaField, Visibility } from "../types";
import { OptionCardRadioGroup } from "./option-card-radio-group";
import { SchemaFieldEditor } from "./schema-field-editor";

interface RequestOptionsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visibility: Visibility;
  onVisibilityChange: (visibility: Visibility) => void;
  maxPriceCredits: number;
  onMaxPriceChange: (credits: number) => void;
  /** The field editor is shown only when the requester picked "My own fields". */
  showSchemaEditor: boolean;
  fields: readonly SchemaField[];
  onFieldsChange: (fields: SchemaField[]) => void;
}

const VISIBILITY_CARDS = VISIBILITY_IDS.map((visibility) => ({
  value: visibility,
  ...VISIBILITY_OPTIONS[visibility],
}));

/** Settings beyond the composer, collapsed by default: who can call it, cost cap, own fields. */
export function RequestOptions({
  open,
  onOpenChange,
  visibility,
  onVisibilityChange,
  maxPriceCredits,
  onMaxPriceChange,
  showSchemaEditor,
  fields,
  onFieldsChange,
}: RequestOptionsProps) {
  const summary = [
    VISIBILITY_OPTIONS[visibility].label,
    `max ${formatCredits(maxPriceCredits)}`,
    ...(showSchemaEditor ? [`${fields.length} ${fields.length === 1 ? "field" : "fields"}`] : []),
  ].join(" · ");

  return (
    <details
      open={open}
      onToggle={(event) => onOpenChange(event.currentTarget.open)}
      className="group rounded-2xl border bg-card"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-2xl p-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
        <SlidersHorizontalIcon aria-hidden className="size-5 shrink-0 text-brand" />
        <span className="font-semibold text-ink-950">Options</span>
        <span className="ml-auto min-w-0 truncate text-muted-foreground text-sm">{summary}</span>
        <ChevronDownIcon
          aria-hidden
          className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
        />
      </summary>

      <div className="flex flex-col gap-5 border-t p-4">
        <div className="flex flex-col gap-2">
          <p className="font-medium text-sm">Visibility</p>
          <OptionCardRadioGroup
            name="Visibility"
            idPrefix="request-visibility"
            value={visibility}
            options={VISIBILITY_CARDS}
            onValueChange={onVisibilityChange}
            className="sm:grid-cols-3"
          />
        </div>

        <FormField
          id="request-max-price"
          label="Max price per call"
          hint="Pricier calls return an error instead."
        >
          {(control) => (
            <div className="flex items-center gap-2">
              <Input
                {...control}
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={maxPriceCredits}
                onChange={(event) => onMaxPriceChange(event.target.valueAsNumber || 0)}
                className="h-9 w-28 tabular-nums"
              />
              <span className="text-muted-foreground text-sm">credits</span>
            </div>
          )}
        </FormField>

        {showSchemaEditor ? (
          <SchemaFieldEditor
            id="request-schema"
            legend="Your fields"
            fields={fields}
            onChange={onFieldsChange}
          />
        ) : null}
      </div>
    </details>
  );
}
