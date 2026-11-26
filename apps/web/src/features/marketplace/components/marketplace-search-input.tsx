"use client";

import { cn } from "cn";
import { SearchIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";

interface MarketplaceSearchInputProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

/** Catalog search field. Pressing "/" anywhere outside a text field focuses it. */
export function MarketplaceSearchInput({
  value,
  onValueChange,
  className,
}: MarketplaceSearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== "/" ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        isEditableTarget(event.target)
      ) {
        return;
      }
      event.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <InputGroup className={cn("h-10 rounded-full bg-background px-1.5", className)}>
      <InputGroupAddon>
        <SearchIcon aria-hidden />
      </InputGroupAddon>
      <InputGroupInput
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        aria-label="Search APIs"
        placeholder="Filter APIs"
        className="text-base md:text-sm"
      />
      <InputGroupAddon align="inline-end">
        <Kbd>/</Kbd>
      </InputGroupAddon>
    </InputGroup>
  );
}

function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}
