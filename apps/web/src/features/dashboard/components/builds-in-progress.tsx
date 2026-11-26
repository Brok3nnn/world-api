import { Progress } from "@/components/ui/progress";
import { formatPercent } from "@/lib/format";
import type { BuildInProgress } from "../types";

interface BuildsInProgressProps {
  builds: readonly BuildInProgress[];
}

export function BuildsInProgress({ builds }: BuildsInProgressProps) {
  return (
    <section aria-labelledby="builds-title" className="rounded-2xl border bg-card p-5 md:p-6">
      <h2 id="builds-title" className="mb-4 font-semibold text-ink-950">
        Being built
      </h2>
      {builds.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nothing is being built right now.</p>
      ) : (
        <ul className="flex flex-col gap-5">
          {builds.map((build) => (
            <li key={build.id} className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-medium text-ink-950 text-sm">{build.title}</p>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {formatPercent(build.progress, 0)}
                </span>
              </div>
              <Progress
                value={build.progress * 100}
                aria-label={`${build.title} build progress`}
                indicatorClassName="bg-violet-600"
              />
              <p className="text-muted-foreground text-xs">{build.currentStep}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
