import { ActivityIcon, BarChart3Icon, CoinsIcon, RadioIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { Viewer } from "@/features/account/types";
import { formatNumber, formatPercent } from "@/lib/format";
import type { DashboardSummary } from "../types";
import { StatCard } from "./stat-card";

interface DashboardStatsProps {
  viewer: Viewer;
  summary: DashboardSummary;
}

export function DashboardStats({ viewer, summary }: DashboardStatsProps) {
  const creditsShare = (viewer.creditsRemaining / viewer.monthlyFreeCredits) * 100;

  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Credits left"
        icon={CoinsIcon}
        value={formatNumber(viewer.creditsRemaining)}
        hint={`of ${formatNumber(viewer.monthlyFreeCredits)} free this month`}
      >
        <Progress
          value={Math.min(100, creditsShare)}
          aria-label="Free credits left this month"
          indicatorClassName="bg-violet-600"
        />
      </StatCard>
      <StatCard
        label="Calls"
        icon={BarChart3Icon}
        value={formatNumber(summary.paidCalls30d)}
        hint="Paid calls, last 30 days"
      />
      <StatCard
        label="Live"
        icon={RadioIcon}
        value={formatNumber(summary.liveEndpoints)}
        hint="APIs serving calls now"
      />
      <StatCard
        label="Uptime"
        icon={ActivityIcon}
        value={summary.averageUptime === null ? "—" : formatPercent(summary.averageUptime, 2)}
        hint="Average across live APIs"
      />
    </dl>
  );
}
