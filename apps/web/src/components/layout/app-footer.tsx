import Link from "next/link";
import { BrandMark } from "@/components/shared/brand-mark";
import { headerNavigation } from "@/config/navigation";

/** Quiet page footer: brand, service status and the primary links. */
export function AppFooter() {
  return (
    <footer className="mt-10 border-t">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 text-muted-foreground text-sm sm:flex-row sm:items-center md:px-6">
        <div className="flex items-center gap-3">
          <BrandMark className="size-6 rounded-lg" />
          <span className="inline-flex items-center gap-2">
            <span aria-hidden className="size-1.5 rounded-full bg-mint-400" />
            All systems live
          </span>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2 sm:ml-auto">
          {headerNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-sm outline-none transition-colors hover:text-ink-950 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
