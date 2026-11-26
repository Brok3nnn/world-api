import { cn } from "cn";
import Link from "next/link";
import { CopyButton } from "@/components/shared/copy-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VISIBILITY_OPTIONS } from "@/features/builder/constants";
import { EndpointCover } from "@/features/catalog/components/endpoint-cover";
import { EndpointStatus } from "@/features/catalog/components/endpoint-status";
import { REFRESH_INTERVALS } from "@/features/catalog/constants";
import { endpointApiUrl, endpointHref } from "@/features/catalog/lib/endpoint-urls";
import { formatCompactNumber, formatNumber } from "@/lib/format";
import type { OwnedEndpointRow } from "../types";

interface OwnedEndpointsTableProps {
  endpoints: readonly OwnedEndpointRow[];
  publisherHandle: string;
}

const NUMERIC_CELL = "text-right tabular-nums";
/** Columns that only fit from tablet width up; phones show their content under the title. */
const WIDE_ONLY = "hidden md:table-cell";

/**
 * The viewer's APIs with their owner-only numbers. On phones the row collapses to the API, its
 * status and its calls.
 */
export function OwnedEndpointsTable({ endpoints, publisherHandle }: OwnedEndpointsTableProps) {
  return (
    <section aria-labelledby="owned-endpoints-title" className="rounded-2xl border bg-card">
      <div className="flex items-baseline justify-between gap-3 px-5 pt-5 pb-3 md:px-6">
        <h2 id="owned-endpoints-title" className="font-semibold text-ink-950">
          Your APIs
        </h2>
        <p className="text-muted-foreground text-xs">Last 30 days</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-5 md:pl-6">API</TableHead>
            <TableHead className={WIDE_ONLY}>Status</TableHead>
            <TableHead className={WIDE_ONLY}>Visibility</TableHead>
            <TableHead className={WIDE_ONLY}>Updates</TableHead>
            <TableHead className={cn(WIDE_ONLY, "text-right")}>Calls</TableHead>
            <TableHead className={cn(WIDE_ONLY, "w-14 pr-4")}>
              <span className="sr-only">Link</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {endpoints.map((endpoint) => {
            const ref = { publisherHandle, slug: endpoint.slug };
            const { label: visibilityLabel, icon: VisibilityIcon } =
              VISIBILITY_OPTIONS[endpoint.visibility];
            return (
              <TableRow key={endpoint.id}>
                {/* `w-full max-w-0` lets the only flexible column truncate instead of scrolling. */}
                <TableCell className="py-3 pl-5 max-md:w-full max-md:max-w-0 md:pl-6">
                  <div className="flex min-w-0 items-center gap-3">
                    <EndpointCover
                      cover={endpoint.cover}
                      sizes="40px"
                      className="size-10 shrink-0 rounded-lg"
                    />
                    <div className="flex min-w-0 flex-col">
                      {endpoint.listedInCatalog ? (
                        <Link
                          href={endpointHref(ref)}
                          className="max-w-full self-start truncate rounded-sm font-semibold text-ink-950 underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                          {endpoint.title}
                        </Link>
                      ) : (
                        <span className="truncate font-semibold text-ink-950">
                          {endpoint.title}
                        </span>
                      )}
                      <span className="truncate text-muted-foreground text-xs">
                        @{publisherHandle}/{endpoint.slug}
                      </span>
                      <span className="mt-1 flex items-center gap-1.5 text-muted-foreground text-xs md:hidden">
                        <EndpointStatus status={endpoint.status} />
                        <span aria-hidden>·</span>
                        <span className="tabular-nums">
                          {formatCompactNumber(endpoint.paidCalls30d)} calls
                        </span>
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className={WIDE_ONLY}>
                  <EndpointStatus status={endpoint.status} />
                </TableCell>
                <TableCell className={WIDE_ONLY}>
                  <span className="inline-flex items-center gap-1.5 text-ink-700 text-xs">
                    <VisibilityIcon aria-hidden className="size-3.5 text-muted-foreground" />
                    {visibilityLabel}
                  </span>
                </TableCell>
                <TableCell className={cn(WIDE_ONLY, "text-ink-700 text-xs")}>
                  {REFRESH_INTERVALS[endpoint.refresh].label}
                </TableCell>
                <TableCell className={cn(WIDE_ONLY, NUMERIC_CELL)}>
                  {formatNumber(endpoint.paidCalls30d)}
                </TableCell>
                <TableCell className={cn(WIDE_ONLY, "pr-4 text-right")}>
                  {endpoint.status === "building" ? null : (
                    <CopyButton
                      value={endpointApiUrl(ref)}
                      label={`Copy the link of ${endpoint.title}`}
                    />
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </section>
  );
}
