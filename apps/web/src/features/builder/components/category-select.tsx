"use client";

import { TagIcon } from "lucide-react";
import type { FieldControlProps } from "@/components/shared/form-field";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { CATEGORIES, CATEGORY_IDS } from "@/features/catalog/constants";
import type { CategoryId } from "@/features/catalog/types";

interface CategorySelectProps extends FieldControlProps {
  value: CategoryId | null;
  onValueChange: (category: CategoryId) => void;
}

/** Catalog category picker, each option shown with its icon. */
export function CategorySelect({ value, onValueChange, ...control }: CategorySelectProps) {
  const SelectedIcon = value ? CATEGORIES[value].icon : null;

  return (
    <Select<CategoryId>
      value={value}
      onValueChange={(category) => {
        if (category !== null) {
          onValueChange(category);
        }
      }}
    >
      <SelectTrigger {...control} className="h-9 w-full">
        {SelectedIcon && value ? (
          <span className="flex min-w-0 items-center gap-2">
            <SelectedIcon aria-hidden className="text-violet-600" />
            {CATEGORIES[value].label}
          </span>
        ) : (
          <span className="flex items-center gap-2 text-muted-foreground">
            <TagIcon aria-hidden />
            Choose a category
          </span>
        )}
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} align="start">
        {CATEGORY_IDS.map((category) => {
          const { label, icon: Icon } = CATEGORIES[category];
          return (
            <SelectItem key={category} value={category}>
              <Icon aria-hidden className="text-violet-600" />
              {label}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
