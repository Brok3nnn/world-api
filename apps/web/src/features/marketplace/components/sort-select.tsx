"use client";

import { ArrowDownWideNarrowIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { SORT_IDS, SORT_OPTIONS } from "@/features/catalog/constants";
import type { EndpointSort } from "@/features/catalog/types";

interface SortSelectProps {
  value: EndpointSort;
  onValueChange: (value: EndpointSort) => void;
}

export function SortSelect({ value, onValueChange }: SortSelectProps) {
  return (
    <Select<EndpointSort>
      value={value}
      onValueChange={(next) => {
        if (next !== null) {
          onValueChange(next);
        }
      }}
    >
      <SelectTrigger aria-label="Sort APIs" className="h-10 rounded-full pr-3 pl-3.5">
        <ArrowDownWideNarrowIcon aria-hidden className="size-3.5 text-muted-foreground" />
        {SORT_OPTIONS[value]}
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} align="end" className="min-w-40">
        {SORT_IDS.map((sort) => (
          <SelectItem key={sort} value={sort}>
            {SORT_OPTIONS[sort]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
