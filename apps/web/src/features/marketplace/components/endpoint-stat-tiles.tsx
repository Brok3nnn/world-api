import { cn } from "cn";
import { ActivityIcon, BarChart3Icon, GaugeIcon, type LucideIcon, TargetIcon } from "lucide-react";
import type { Endpoint } from "@/features/catalog/types";
import { formatCompactNumber, formatPercent } from "@/lib/format";

interface EndpointStatTilesProps {
  endpoint: Endpoint;
}

interface StatTile {
  label: string;
  value: string;
  icon: LucideIcon;
}

/** Quality and usage signals as compact icon tiles. */
export function EndpointStatTiles({ endpoint }: EndpointStatTilesProps) {
  const { stats } = endpoint;
  const tiles: StatTile[] = [
    { label: "Uptime", value: formatPercent(stats.uptime, 2), icon: ActivityIcon },
    { label: "Speed", value: `${stats.latencyP50Ms} ms`, icon: GaugeIcon },
    { label: "Calls", value: formatCompactNumber(stats.paidCalls30d), icon: BarChart3Icon },
    ...(stats.calibration === undefined
      ? []
      : [{ label: "Accuracy", value: formatPercent(stats.calibration, 0), icon: TargetIcon }]),
  ];

  return (
    <dl
      className={cn(
        "grid grid-cols-2 gap-3",
        tiles.length > 3 ? "sm:grid-cols-4" : "sm:grid-cols-3",
      )}
    >
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <div key={tile.label} className="flex flex-col gap-2 rounded-2xl bg-ink-50 p-4">
            <dt className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <Icon aria-hidden className="size-3.5 text-violet-600" />
              {tile.label}
            </dt>
            <dd className="font-heading text-ink-950 text-xl tabular-nums">{tile.value}</dd>
          </div>
        );
      })}
    </dl>
  );
}
