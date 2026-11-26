"use client";

import { SearchIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { Kbd, KbdGroup } from "@/components/ui/kbd";

interface SearchInputProps {
  value: string;
  /** Omitted for the static prerendered fallback, which stays read-only until hydration. */
  onValueChange?: (value: string) => void;
}

/** The large search field of the /search page. */
export function SearchInput({ value, onValueChange }: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const interactive = onValueChange !== undefined;

  useEffect(() => {
    // The search page has one primary field, so focusing it on arrival is the expected behaviour.
    if (interactive) {
      inputRef.current?.focus();
    }
  }, [interactive]);

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <label htmlFor="search-page-input" className="sr-only">
        Search endpoints, publishers and categories
      </label>
      <SearchIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-5 size-5 -translate-y-1/2 text-ink-500"
      />
      <input
        ref={inputRef}
        id="search-page-input"
        type="search"
        value={value}
        onChange={(event) => onValueChange?.(event.target.value)}
        readOnly={!interactive}
        placeholder="Weather, parking, @mira_field, probability…"
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="search"
        className="h-14 w-full rounded-full border border-input bg-card pr-5 pl-13 text-base text-ink-950 shadow-card outline-none transition-shadow placeholder:text-ink-500/80 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:pr-44 md:text-lg"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-5 hidden -translate-y-1/2 items-center gap-2 text-muted-foreground text-xs sm:flex"
      >
        Jump anywhere
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </span>
    </div>
  );
}
