"use client";

import { cn } from "cn";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/shared/brand-mark";
import { headerNavigation, isNavItemActive } from "@/config/navigation";

interface AppHeaderProps {
  /** Search control, injected by the route layout (it belongs to the search feature). */
  search: ReactNode;
  /** Account controls, injected by the route layout (they belong to the account feature). */
  account: ReactNode;
}

/** Sticky top bar: brand, search, primary links and the account controls. */
export function AppHeader({ search, account }: AppHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-lg">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 md:gap-4 md:px-6">
        <Link
          href="/"
          aria-label="Home"
          className="shrink-0 rounded-[10px] outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <BrandMark />
        </Link>

        <div className="min-w-0 flex-1 md:max-w-56 lg:max-w-sm">{search}</div>

        <nav aria-label="Primary" className="hidden items-center gap-0.5 md:flex">
          {headerNavigation.map((item) => {
            const active = isNavItemActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-3 py-1.5 font-medium text-ink-500 text-sm transition-colors outline-none hover:bg-ink-50 hover:text-ink-950 focus-visible:ring-3 focus-visible:ring-ring/50",
                  active && "bg-ink-100 text-ink-950 hover:bg-ink-100",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto shrink-0">{account}</div>
      </div>
    </header>
  );
}
