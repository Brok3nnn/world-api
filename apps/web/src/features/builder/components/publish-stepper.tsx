import { cn } from "cn";
import { CheckIcon } from "lucide-react";
import { PUBLISH_STEP_IDS, PUBLISH_STEPS } from "../constants";
import type { PublishStepId } from "../types";

interface PublishStepperProps {
  current: PublishStepId;
  /** Called for finished steps only; later steps open through validation. */
  onStepSelect: (step: PublishStepId) => void;
}

type StepState = "done" | "current" | "upcoming";

const TILE_STYLES: Record<StepState, string> = {
  done: "bg-mint-100 text-mint-600",
  current: "bg-brand text-brand-foreground",
  upcoming: "bg-ink-50 text-ink-500 ring-1 ring-border",
};

const STATE_LABELS: Record<StepState, string> = {
  done: "done",
  current: "current step",
  upcoming: "not started",
};

function stepState(index: number, currentIndex: number): StepState {
  if (index < currentIndex) {
    return "done";
  }
  return index === currentIndex ? "current" : "upcoming";
}

/** Numbered step icons with short labels. Finished steps are buttons that jump back. */
export function PublishStepper({ current, onStepSelect }: PublishStepperProps) {
  const currentIndex = PUBLISH_STEP_IDS.indexOf(current);

  return (
    <nav aria-label="Steps">
      <ol className="grid grid-cols-4 gap-2">
        {PUBLISH_STEP_IDS.map((stepId, index) => {
          const { label, icon: Icon } = PUBLISH_STEPS[stepId];
          const state = stepState(index, currentIndex);
          const content = (
            <>
              <span className="flex w-full items-center gap-2">
                <span
                  aria-hidden
                  className={cn(
                    "inline-flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                    TILE_STYLES[state],
                  )}
                >
                  {state === "done" ? (
                    <CheckIcon className="size-4" />
                  ) : (
                    <Icon className="size-4" />
                  )}
                </span>
                <span aria-hidden className="h-px flex-1 bg-border group-last/step:hidden" />
              </span>
              <span
                className={cn(
                  "font-medium text-xs sm:text-sm",
                  state === "upcoming" ? "text-ink-500" : "text-ink-950",
                )}
              >
                <span className="text-muted-foreground tabular-nums">{index + 1}</span> {label}
                <span className="sr-only">, {STATE_LABELS[state]}</span>
              </span>
            </>
          );

          return (
            <li
              key={stepId}
              aria-current={state === "current" ? "step" : undefined}
              className="group/step min-w-0"
            >
              {state === "done" ? (
                <button
                  type="button"
                  onClick={() => onStepSelect(stepId)}
                  className="flex w-full flex-col items-start gap-2 rounded-lg text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {content}
                </button>
              ) : (
                <div className="flex flex-col items-start gap-2">{content}</div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
