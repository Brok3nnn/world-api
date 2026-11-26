"use client";

import { cn } from "cn";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavItemActive, mobileNavigation } from "@/config/navigation";

/** Bottom tab bar below `md`, where the header has no room for links. */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden"
    >
      <ul className="grid grid-cols-5">
        {mobileNavigation.map((item) => {
          const Icon = item.icon;
          const active = isNavItemActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[0.6875rem] text-ink-500 outline-none focus-visible:bg-ink-50",
                  active && "text-violet-700",
                )}
              >
                <Icon aria-hidden className="size-5" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
