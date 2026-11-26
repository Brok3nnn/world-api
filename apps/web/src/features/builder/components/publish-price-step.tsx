"use client";

import { RefreshCwIcon } from "lucide-react";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { REFRESH_INTERVAL_IDS, REFRESH_INTERVALS } from "@/features/catalog/constants";
import type { RefreshInterval } from "@/features/catalog/types";
import type { PublishStepProps } from "../types";

/** Step 3: price per call, in credits, and how often the value updates. */
export function PublishPriceStep({ draft, errors, onChange }: PublishStepProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <FormField
        id="publish-price"
        label="Credits per call"
        hint="Credits are the planned unit of price. Nothing is charged in this prototype."
        error={errors.priceCredits}
      >
        {(control) => (
          <div className="flex items-center gap-2">
            <Input
              {...control}
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={draft.priceCredits}
              onChange={(event) => onChange({ priceCredits: event.target.valueAsNumber || 0 })}
              className="h-9 w-28 tabular-nums"
            />
            <span className="text-muted-foreground text-sm">credits</span>
          </div>
        )}
      </FormField>

      <FormField id="publish-refresh" label="Updates">
        {(control) => (
          <Select<RefreshInterval>
            value={draft.refresh}
            onValueChange={(refresh) => {
              if (refresh !== null) {
                onChange({ refresh });
              }
            }}
          >
            <SelectTrigger {...control} className="h-9 w-full">
              <span className="flex items-center gap-2">
                <RefreshCwIcon aria-hidden className="text-muted-foreground" />
                {REFRESH_INTERVALS[draft.refresh].label}
              </span>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} align="start">
              {REFRESH_INTERVAL_IDS.map((interval) => (
                <SelectItem key={interval} value={interval}>
                  {REFRESH_INTERVALS[interval].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </FormField>
    </div>
  );
}
