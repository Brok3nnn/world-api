"use client";

import { cn } from "cn";
import type { LucideIcon } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface OptionCard<Value extends string> {
  value: Value;
  label: string;
  /** One short line under the label. */
  description: string;
  icon: LucideIcon;
}

interface OptionCardRadioGroupProps<Value extends string> {
  /** Accessible name of the group. */
  name: string;
  /** Prefix for the per-option ids that tie each label to its radio. */
  idPrefix: string;
  value: Value;
  options: readonly OptionCard<Value>[];
  onValueChange: (value: Value) => void;
  /** `lg` gives the icon more weight, for choices that define the whole flow. */
  size?: "md" | "lg";
  className?: string;
}

const SIZES = {
  md: { card: "p-3", tile: "size-9 [&_svg]:size-4" },
  lg: { card: "p-4", tile: "size-11 [&_svg]:size-5" },
} as const;

/** Single choice rendered as selectable cards: icon, label and a one-line description. */
export function OptionCardRadioGroup<Value extends string>({
  name,
  idPrefix,
  value,
  options,
  onValueChange,
  size = "md",
  className,
}: OptionCardRadioGroupProps<Value>) {
  return (
    <RadioGroup
      aria-label={name}
      value={value}
      onValueChange={(next) => {
        const selected = options.find((option) => option.value === next);
        if (selected) {
          onValueChange(selected.value);
        }
      }}
      className={cn("grid grid-cols-1 gap-2", className)}
    >
      {options.map((option) => {
        const id = `${idPrefix}-${option.value}`;
        const Icon = option.icon;
        return (
          <div
            key={option.value}
            className={cn(
              "group/option relative flex min-w-0 items-center gap-3 rounded-xl border bg-card transition-colors hover:bg-ink-50 has-data-checked:border-transparent has-data-checked:bg-lilac-50 has-data-checked:ring-2 has-data-checked:ring-violet-500/40",
              SIZES[size].card,
            )}
          >
            <span
              aria-hidden
              className={cn(
                "inline-flex shrink-0 items-center justify-center rounded-lg bg-ink-50 text-ink-700 transition-colors group-has-data-checked/option:bg-brand group-has-data-checked/option:text-brand-foreground",
                SIZES[size].tile,
              )}
            >
              <Icon />
            </span>
            <label
              htmlFor={id}
              className="flex min-w-0 flex-1 cursor-pointer flex-col gap-0.5 after:absolute after:inset-0 after:rounded-xl"
            >
              <span className="font-semibold text-ink-950 text-sm">{option.label}</span>
              <span className="text-muted-foreground text-xs">{option.description}</span>
            </label>
            <RadioGroupItem id={id} value={option.value} />
          </div>
        );
      })}
    </RadioGroup>
  );
}
