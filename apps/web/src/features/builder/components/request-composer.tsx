"use client";

import { cn } from "cn";
import { ArrowUpIcon, BlendIcon, BracesIcon, RefreshCwIcon } from "lucide-react";
import type { FormEvent, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { REFRESH_INTERVAL_IDS, REFRESH_INTERVALS, SHAPES } from "@/features/catalog/constants";
import {
  COMPOSER_PLACEHOLDERS,
  REQUESTED_SHAPES,
  type RequestedShape,
  SOURCE_MIX_LABELS,
  SOURCE_MIX_OPTIONS,
} from "../constants";
import { useRotatingPlaceholder } from "../hooks/use-rotating-placeholder";
import type { BuildRequest } from "../types";
import { ChipSelect } from "./chip-select";

interface RequestComposerProps {
  value: BuildRequest;
  onChange: (value: BuildRequest) => void;
  onSubmit: (value: BuildRequest) => void;
  submitLabel?: string;
  className?: string;
}

const SOURCE_OPTIONS = SOURCE_MIX_OPTIONS.map((option) => ({
  value: option,
  label: SOURCE_MIX_LABELS[option],
}));

const SHAPE_OPTIONS = REQUESTED_SHAPES.map((shape) => ({
  value: shape,
  label: shapeLabel(shape),
}));

const REFRESH_OPTIONS = REFRESH_INTERVAL_IDS.map((interval) => ({
  value: interval,
  label: REFRESH_INTERVALS[interval].label,
}));

/** The "describe the API you need" box: one sentence plus sources, shape and refresh settings. */
export function RequestComposer({
  value,
  onChange,
  onSubmit,
  submitLabel = "Build API",
  className,
}: RequestComposerProps) {
  const placeholder = useRotatingPlaceholder(COMPOSER_PLACEHOLDERS, value.q === "");
  const canSubmit = value.q.trim().length > 0;

  const update = (patch: Partial<BuildRequest>) => onChange({ ...value, ...patch });

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    if (canSubmit) {
      onSubmit({ ...value, q: value.q.trim() });
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      submit(event);
    }
  };

  return (
    <form
      onSubmit={submit}
      className={cn(
        "rounded-2xl bg-card p-3 text-left shadow-card ring-1 ring-border transition-shadow focus-within:shadow-float focus-within:ring-cobalt-500/50",
        className,
      )}
    >
      <label htmlFor="request-composer-input" className="sr-only">
        Describe the API you need
      </label>
      <textarea
        id="request-composer-input"
        value={value.q}
        onChange={(event) => update({ q: event.target.value })}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        rows={2}
        maxLength={500}
        className="field-sizing-content max-h-48 min-h-14 w-full resize-none bg-transparent px-2 pt-1.5 text-base text-ink-950 outline-none placeholder:text-ink-500/80 md:text-lg"
      />
      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <ChipSelect
            name="Sources to mix"
            icon={BlendIcon}
            value={value.sources}
            options={SOURCE_OPTIONS}
            onValueChange={(sources) => update({ sources })}
          />
          <ChipSelect
            name="Output shape"
            icon={BracesIcon}
            value={value.shape}
            options={SHAPE_OPTIONS}
            onValueChange={(shape) => update({ shape })}
          />
          <ChipSelect
            name="Refresh interval"
            icon={RefreshCwIcon}
            value={value.refresh}
            options={REFRESH_OPTIONS}
            onValueChange={(refresh) => update({ refresh })}
          />
        </div>
        <Button
          type="submit"
          variant="brand"
          size="icon"
          aria-label={submitLabel}
          disabled={!canSubmit}
          className="shrink-0"
        >
          <ArrowUpIcon aria-hidden />
        </Button>
      </div>
    </form>
  );
}

function shapeLabel(shape: RequestedShape): string {
  return shape === "custom" ? "My own fields" : SHAPES[shape].label;
}
