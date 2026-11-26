import { CoinsIcon, HammerIcon, type LucideIcon } from "lucide-react";
import { sampleCreditCosts } from "@/config/site";
import { formatCompactNumber } from "@/lib/format";
import { estimateCallCredits } from "../lib/estimate-call-credits";
import type { BuildRequest } from "../types";

interface BuildCostSummaryProps {
  request: Pick<BuildRequest, "shape" | "sources">;
}

interface CostTile {
  label: string;
  value: string;
  icon: LucideIcon;
}

/** What the build and each later call cost, in credits, as two stat tiles. */
export function BuildCostSummary({ request }: BuildCostSummaryProps) {
  const [buildMin, buildMax] = sampleCreditCosts.newEndpoint;
  const perCall = estimateCallCredits(request);
  const tiles: CostTile[] = [
    { label: "Build, once", value: range(buildMin, buildMax), icon: HammerIcon },
    { label: "Each call", value: range(perCall.min, perCall.max), icon: CoinsIcon },
  ];

  return (
    <section aria-label="Cost" className="flex flex-col gap-2">
      <dl className="grid grid-cols-2 gap-3">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <div key={tile.label} className="flex min-w-0 flex-col gap-2 rounded-xl border p-4">
              <dt className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Icon aria-hidden className="size-3.5 text-amber-600" />
                {tile.label}
              </dt>
              <dd className="font-semibold text-ink-950 text-lg tabular-nums leading-tight">
                {tile.value}
                <span className="ml-1 font-medium text-ink-500 text-xs">credits</span>
              </dd>
            </div>
          );
        })}
      </dl>
      <p className="text-muted-foreground text-xs">Free if it can’t be built.</p>
    </section>
  );
}

function range(min: number, max: number): string {
  return min === max
    ? formatCompactNumber(min)
    : `${formatCompactNumber(min)}–${formatCompactNumber(max)}`;
}
