import { BadgeCheckIcon } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PublisherAvatar } from "@/features/catalog/components/publisher-avatar";
import { publisherHref } from "@/features/catalog/lib/endpoint-urls";
import { formatCompactNumber, formatNumber, formatPercent } from "@/lib/format";
import type { PublisherRanking } from "../types";

interface PublisherLeaderboardProps {
  rankings: readonly PublisherRanking[];
}

const NUMERIC_CELL = "text-right tabular-nums";

export function PublisherLeaderboard({ rankings }: PublisherLeaderboardProps) {
  return (
    <div className="rounded-2xl bg-card px-2 py-1 ring-1 ring-border">
      <Table>
        <TableCaption className="sr-only">
          Publishers ranked by paid calls in the last 30 days
        </TableCaption>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10 text-center">#</TableHead>
            <TableHead>Publisher</TableHead>
            <TableHead className="text-right">APIs</TableHead>
            <TableHead className="text-right">Calls</TableHead>
            <TableHead className="text-right">Uptime</TableHead>
            <TableHead className="text-right">Likes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rankings.map(
            ({ rank, publisher, endpointCount, paidCalls30d, averageUptime, totalLikes }) => (
              <TableRow key={publisher.handle}>
                <TableCell className="text-center font-semibold text-muted-foreground text-xs tabular-nums">
                  {rank}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3 py-1">
                    <PublisherAvatar name={publisher.displayName} seed={publisher.handle} />
                    <div className="flex min-w-0 flex-col">
                      <span className="flex items-center gap-1.5 font-semibold text-ink-950">
                        <Link
                          href={publisherHref(publisher.handle)}
                          className="truncate rounded-sm outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                          {publisher.displayName}
                        </Link>
                        {publisher.verified ? (
                          <BadgeCheckIcon
                            aria-label="Verified"
                            className="size-4 shrink-0 text-violet-600"
                          />
                        ) : null}
                      </span>
                      <span className="truncate text-muted-foreground text-xs">
                        @{publisher.handle}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className={NUMERIC_CELL}>{formatNumber(endpointCount)}</TableCell>
                <TableCell className={NUMERIC_CELL}>{formatCompactNumber(paidCalls30d)}</TableCell>
                <TableCell className={NUMERIC_CELL}>{formatPercent(averageUptime, 2)}</TableCell>
                <TableCell className={NUMERIC_CELL}>{formatCompactNumber(totalLikes)}</TableCell>
              </TableRow>
            ),
          )}
        </TableBody>
      </Table>
    </div>
  );
}
