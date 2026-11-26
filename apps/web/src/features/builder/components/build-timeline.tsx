import { cn } from "cn";
import { CircleCheckIcon, CircleIcon, LoaderCircleIcon } from "lucide-react";
import { BUILD_STEPS } from "../constants";
import { describeBuildStep } from "../lib/describe-build-step";
import type { BuildJob, BuildStepStatus } from "../types";

interface BuildTimelineProps {
  job: BuildJob | null;
  stepStatus: (stepIndex: number) => BuildStepStatus;
}

const STATUS_ICONS = {
  pending: <CircleIcon aria-hidden className="size-4 shrink-0 text-ink-300" />,
  running: (
    <LoaderCircleIcon aria-hidden className="size-4 shrink-0 text-brand motion-safe:animate-spin" />
  ),
  done: <CircleCheckIcon aria-hidden className="size-4 shrink-0 text-mint-600" />,
} as const satisfies Record<BuildStepStatus, unknown>;

const STATUS_LABELS: Record<BuildStepStatus, string> = {
  pending: "Pending",
  running: "In progress",
  done: "Done",
};

function timelineTitle(started: boolean, finished: boolean): string {
  if (!started) {
    return "How it works";
  }
  return finished ? "Built" : "Building your API";
}

/** The build steps: how it works before a request, live progress while building. */
export function BuildTimeline({ job, stepStatus }: BuildTimelineProps) {
  const doneCount = BUILD_STEPS.filter((_, index) => stepStatus(index) === "done").length;
  const title = timelineTitle(job !== null, doneCount === BUILD_STEPS.length);

  return (
    <section
      aria-labelledby="build-timeline-title"
      className="flex flex-col gap-4 rounded-2xl border bg-card p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="build-timeline-title" className="font-semibold text-ink-950">
          {title}
        </h2>
        {job ? (
          <span className="text-muted-foreground text-sm tabular-nums">
            {doneCount}/{BUILD_STEPS.length}
          </span>
        ) : null}
      </div>
      <p aria-live="polite" className="sr-only">
        {job ? announce(stepStatus) : ""}
      </p>
      <ol className="flex flex-col gap-3">
        {BUILD_STEPS.map((step, index) => {
          const status = stepStatus(index);
          const Icon = step.icon;
          const isPending = job !== null && status === "pending";
          return (
            <li key={step.id} className="flex items-center gap-3">
              <span
                aria-hidden
                className={cn(
                  "inline-flex size-8 shrink-0 items-center justify-center rounded-lg",
                  isPending ? "bg-ink-50 text-ink-300" : "bg-lilac-50 text-brand",
                )}
              >
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={cn("font-medium text-sm", isPending ? "text-ink-500" : "text-ink-950")}
                >
                  {step.title}
                  {job ? <span className="sr-only">, {STATUS_LABELS[status]}</span> : null}
                </p>
                {job && status === "done" ? (
                  <p className="truncate text-muted-foreground text-xs">
                    {describeBuildStep(step.id, job)}
                  </p>
                ) : null}
              </div>
              {job ? STATUS_ICONS[status] : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function announce(stepStatus: (stepIndex: number) => BuildStepStatus): string {
  const runningStep = BUILD_STEPS.find((_, index) => stepStatus(index) === "running");
  return runningStep ? `Building: ${runningStep.title}` : "Build complete";
}
