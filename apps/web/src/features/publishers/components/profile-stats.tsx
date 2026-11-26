import { BarChart3Icon, BoxesIcon, HeartIcon, type LucideIcon } from "lucide-react";
import type { Endpoint } from "@/features/catalog/types";
import { formatCompactNumber, formatNumber } from "@/lib/format";

interface ProfileStatsProps {
  endpoints: readonly Endpoint[];
}

interface Stat {
  label: string;
  value: string;
  icon: LucideIcon;
}

/** Totals across a publisher's APIs. */
export function ProfileStats({ endpoints }: ProfileStatsProps) {
  const calls = endpoints.reduce((sum, endpoint) => sum + endpoint.stats.paidCalls30d, 0);
  const likes = endpoints.reduce((sum, endpoint) => sum + endpoint.stats.likes, 0);
  const stats: Stat[] = [
    { label: "APIs", value: formatNumber(endpoints.length), icon: BoxesIcon },
    { label: "Calls", value: formatCompactNumber(calls), icon: BarChart3Icon },
    { label: "Likes", value: formatCompactNumber(likes), icon: HeartIcon },
  ];

  return (
    <dl className="grid grid-cols-3 gap-3 sm:max-w-md">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="flex flex-col gap-1.5 rounded-2xl bg-ink-50 p-3.5">
            <dt className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <Icon aria-hidden className="size-3.5 text-violet-600" />
              {stat.label}
            </dt>
            <dd className="font-heading text-ink-950 text-xl tabular-nums">{stat.value}</dd>
          </div>
        );
      })}
    </dl>
  );
}
