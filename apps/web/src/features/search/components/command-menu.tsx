"use client";

import { HammerIcon, SearchIcon } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { allPages } from "@/config/navigation";
import { builderUrl } from "@/features/builder/search-params";
import { EndpointCover } from "@/features/catalog/components/endpoint-cover";
import { endpointHref } from "@/features/catalog/lib/endpoint-urls";
import { filterEndpoints } from "@/features/catalog/lib/filter-endpoints";
import type { EndpointSummary } from "@/features/catalog/types";
import { searchUrl } from "../search-params";

interface CommandMenuProps {
  endpoints: readonly EndpointSummary[];
}

const MAX_ENDPOINT_RESULTS = 6;

/**
 * Header search field that opens a ⌘K / Ctrl+K palette: jump to APIs and pages, or start a build.
 */
export function CommandMenu({ endpoints }: CommandMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const navigate = (href: Route) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  const trimmedQuery = query.trim();
  const matches = filterEndpoints(endpoints, { query: trimmedQuery }).slice(
    0,
    MAX_ENDPOINT_RESULTS,
  );
  const pages = allPages.filter((page) =>
    page.label.toLowerCase().includes(trimmedQuery.toLowerCase()),
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search APIs"
        className="flex h-10 w-full items-center gap-2.5 rounded-full bg-ink-50 px-3.5 text-left text-ink-500 text-sm ring-1 ring-border transition-colors outline-none hover:bg-ink-100 focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <SearchIcon aria-hidden className="size-4 shrink-0" />
        <span className="flex-1 truncate">Search</span>
        <Kbd className="hidden lg:inline-flex">⌘K</Kbd>
      </button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search"
        description="Search APIs and pages, or build a new API."
        className="sm:max-w-xl"
      >
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search APIs, or describe the data you need"
          />
          <CommandList>
            <CommandEmpty>Nothing matches yet.</CommandEmpty>
            {trimmedQuery ? (
              <CommandGroup heading="Actions">
                <CommandItem
                  value="action-search"
                  onSelect={() => navigate(searchUrl({ q: trimmedQuery }))}
                >
                  <SearchIcon aria-hidden />
                  See all results for “{trimmedQuery}”
                </CommandItem>
                <CommandItem
                  value="action-build"
                  onSelect={() => navigate(builderUrl({ q: trimmedQuery }))}
                >
                  <HammerIcon aria-hidden />
                  Build an API for “{trimmedQuery}”
                </CommandItem>
              </CommandGroup>
            ) : null}
            {matches.length > 0 ? (
              <CommandGroup heading="APIs">
                {matches.map((endpoint) => (
                  <CommandItem
                    key={endpoint.id}
                    value={endpoint.id}
                    onSelect={() => navigate(endpointHref(endpoint))}
                    className="gap-3"
                  >
                    <EndpointCover
                      cover={endpoint.cover}
                      sizes="32px"
                      className="size-8 shrink-0 rounded-md"
                    />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-medium text-ink-950">{endpoint.title}</span>
                      <span className="truncate text-muted-foreground text-xs">
                        @{endpoint.publisherHandle}
                      </span>
                    </span>
                    <CommandShortcut className="shrink-0 font-medium text-ink-800 text-sm tabular-nums tracking-normal">
                      {endpoint.preview.value}
                      {endpoint.preview.unit ? ` ${endpoint.preview.unit}` : null}
                    </CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
            {pages.length > 0 ? (
              <CommandGroup heading="Pages">
                {pages.map((page) => {
                  const Icon = page.icon;
                  return (
                    <CommandItem
                      key={page.href}
                      value={`page-${page.href}`}
                      onSelect={() => navigate(page.href)}
                    >
                      <Icon aria-hidden />
                      {page.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
