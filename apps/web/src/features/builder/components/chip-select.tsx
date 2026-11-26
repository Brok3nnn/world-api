"use client";

import type { LucideIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

interface ChipSelectOption<Value extends string> {
  value: Value;
  label: string;
}

interface ChipSelectProps<Value extends string> {
  /** Accessible name of the control, e.g. "Output shape". */
  name: string;
  icon: LucideIcon;
  value: Value;
  options: readonly ChipSelectOption<Value>[];
  onValueChange: (value: Value) => void;
}

/** Compact pill-shaped single select used for composer settings. */
export function ChipSelect<Value extends string>({
  name,
  icon: Icon,
  value,
  options,
  onValueChange,
}: ChipSelectProps<Value>) {
  const selected = options.find((option) => option.value === value);

  return (
    <Select<Value>
      value={value}
      onValueChange={(next) => {
        if (next !== null) {
          onValueChange(next);
        }
      }}
    >
      <SelectTrigger
        size="sm"
        aria-label={name}
        className="h-8 rounded-full border-transparent bg-ink-50 pr-2 pl-2.5 text-ink-700 text-xs ring-1 ring-border hover:bg-ink-100 data-popup-open:bg-lilac-50 data-popup-open:text-violet-700"
      >
        <Icon aria-hidden className="size-3.5" />
        {selected?.label}
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} align="start" className="min-w-44">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
