"use client";

import { cn } from "cn";
import type { LucideIcon } from "lucide-react";
import { useSyncExternalStore } from "react";

export interface SectionNavItem {
  /** Anchor id of the section on the page. */
  id: string;
  label: string;
  icon: LucideIcon;
}

interface SectionNavProps {
  /** Accessible name, e.g. "On this page". */
  label: string;
  sections: readonly SectionNavItem[];
}

/** A section counts as reached once its top passes this line, just under the sticky header. */
const READING_LINE_PX = 120;

function subscribe(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  window.addEventListener("resize", onChange);
  window.addEventListener("hashchange", onChange);
  return () => {
    window.removeEventListener("scroll", onChange);
    window.removeEventListener("resize", onChange);
    window.removeEventListener("hashchange", onChange);
  };
}

function readActiveSection(ids: readonly string[]): string | undefined {
  let reached = ids[0];
  const upcoming: string[] = [];
  for (const id of ids) {
    const top = document.getElementById(id)?.getBoundingClientRect().top;
    if (top === undefined) {
      continue;
    }
    if (top <= READING_LINE_PX) {
      reached = id;
    } else {
      upcoming.push(id);
    }
  }

  const scrolledToEnd =
    window.scrollY > 0 &&
    window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
  if (!scrolledToEnd) {
    return reached;
  }
  // The last sections can never reach the line, so prefer the one the visitor jumped to.
  const jumpTarget = upcoming.find((id) => `#${id}` === window.location.hash);
  return jumpTarget ?? upcoming.at(-1) ?? reached;
}

/**
 * In-page section links that highlight the section being read: scrollable pills on small
 * screens, a sticky list on large ones.
 */
export function SectionNav({ label, sections }: SectionNavProps) {
  const ids = sections.map((section) => section.id);
  const activeSection = useSyncExternalStore(
    subscribe,
    () => readActiveSection(ids),
    () => ids[0],
  );

  return (
    <nav
      aria-label={label}
      className="-mx-4 -my-1 overflow-x-auto px-4 py-1 [scrollbar-width:none] md:-mx-6 md:px-6 lg:sticky lg:top-24 lg:m-0 lg:self-start lg:overflow-visible lg:p-0"
    >
      <ul className="flex w-max gap-1.5 lg:w-auto lg:flex-col lg:gap-1">
        {sections.map(({ id, label: sectionLabel, icon: Icon }) => {
          const active = id === activeSection;
          return (
            <li key={id}>
              <a
                href={`#${id}`}
                aria-current={active ? "location" : undefined}
                className={cn(
                  "flex h-9 items-center gap-2 whitespace-nowrap rounded-full bg-ink-50 px-3 font-medium text-ink-700 text-sm outline-none ring-1 ring-border transition-colors hover:bg-ink-100 hover:text-ink-950 focus-visible:ring-3 focus-visible:ring-ring/50 lg:ring-0",
                  active
                    ? "lg:bg-lilac-50 lg:text-violet-700 lg:hover:bg-lilac-50 lg:hover:text-violet-700"
                    : "lg:bg-transparent lg:text-ink-500 lg:hover:bg-ink-50 lg:hover:text-ink-950",
                )}
              >
                <Icon aria-hidden className="size-4" />
                {sectionLabel}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
