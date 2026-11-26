import { EndpointCover } from "@/features/catalog/components/endpoint-cover";
import { CATEGORIES, CATEGORY_COVERS } from "@/features/catalog/constants";
import type { CategoryId } from "@/features/catalog/types";
import { formatNumber } from "@/lib/format";

interface CategoryButtonProps {
  category: CategoryId;
  /** Number of APIs in the category. */
  count: number;
  onSelect: () => void;
}

/** Category tile that searches for the category when chosen. */
export function CategoryButton({ category, count, onSelect }: CategoryButtonProps) {
  const { label, icon: Icon } = CATEGORIES[category];

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex w-full items-center gap-3 rounded-2xl bg-card p-2.5 pr-4 text-left ring-1 ring-border transition-shadow outline-none hover:shadow-float focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <EndpointCover
        cover={CATEGORY_COVERS[category]}
        sizes="48px"
        className="size-12 shrink-0 rounded-xl"
      />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="inline-flex items-center gap-1.5 font-semibold text-ink-950 text-sm">
          <Icon aria-hidden className="size-3.5 text-violet-600" />
          {label}
        </span>
        <span className="text-muted-foreground text-xs tabular-nums">
          {formatNumber(count)} {count === 1 ? "API" : "APIs"}
        </span>
      </span>
    </button>
  );
}
