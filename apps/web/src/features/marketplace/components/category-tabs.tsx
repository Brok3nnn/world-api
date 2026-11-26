import { cn } from "cn";
import { LayoutGridIcon, type LucideIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { CATEGORIES } from "@/features/catalog/constants";
import type { CategoryId } from "@/features/catalog/types";
import { type MarketplaceParams, marketplaceUrl } from "../search-params";

interface CategoryTabsProps {
  categories: readonly CategoryId[];
  /** `null` marks "All" as active. */
  active: CategoryId | null;
  /** Other marketplace params to keep when switching category (query, sort). */
  params?: Partial<MarketplaceParams>;
  className?: string;
}

/** Category pills. Each one is a link into the marketplace, so it works from any page. */
export function CategoryTabs({ categories, active, params = {}, className }: CategoryTabsProps) {
  return (
    <nav
      aria-label="Categories"
      className={cn(
        "-mx-4 overflow-x-auto px-4 [scrollbar-width:none] md:-mx-6 md:px-6",
        className,
      )}
    >
      <ul className="flex w-max gap-1.5">
        <CategoryTab
          href={marketplaceUrl({ ...params, category: null })}
          label="All"
          icon={LayoutGridIcon}
          active={active === null}
        />
        {categories.map((category) => (
          <CategoryTab
            key={category}
            href={marketplaceUrl({ ...params, category })}
            label={CATEGORIES[category].label}
            icon={CATEGORIES[category].icon}
            active={active === category}
          />
        ))}
      </ul>
    </nav>
  );
}

interface CategoryTabProps {
  href: Route;
  label: string;
  icon: LucideIcon;
  active: boolean;
}

function CategoryTab({ href, label, icon: Icon, active }: CategoryTabProps) {
  return (
    <li>
      <Link
        href={href}
        scroll={false}
        aria-current={active ? "page" : undefined}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full px-3 font-medium text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
          active
            ? "bg-ink-950 text-white"
            : "bg-ink-50 text-ink-700 ring-1 ring-border hover:bg-ink-100 hover:text-ink-950",
        )}
      >
        <Icon aria-hidden className="size-4" />
        {label}
      </Link>
    </li>
  );
}
