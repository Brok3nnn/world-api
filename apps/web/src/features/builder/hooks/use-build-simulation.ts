"use client";

import { useEffect, useState } from "react";
import { BUILD_STEP_DURATION_MS, BUILD_STEP_DURATION_REDUCED_MS, BUILD_STEPS } from "../constants";
import type { BuildJob, BuildStepStatus } from "../types";

interface BuildRun {
  job: BuildJob;
  completedSteps: number;
}

interface BuildSimulation {
  job: BuildJob | null;
  isRunning: boolean;
  isComplete: boolean;
  stepStatus: (stepIndex: number) => BuildStepStatus;
  /** Starts a build; a running or finished one is replaced. */
  start: (job: BuildJob) => void;
}

/**
 * Walks a build job through the pipeline steps on a timer. Stands in for the builder agent's
 * progress stream until the backend exists; the returned API stays the same.
 */
export function useBuildSimulation(): BuildSimulation {
  const [run, setRun] = useState<BuildRun | null>(null);
  const isComplete = run !== null && run.completedSteps >= BUILD_STEPS.length;

  useEffect(() => {
    if (run === null || run.completedSteps >= BUILD_STEPS.length) {
      return;
    }
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timeout = window.setTimeout(
      () =>
        setRun((current) =>
          current ? { ...current, completedSteps: current.completedSteps + 1 } : current,
        ),
      reducedMotion ? BUILD_STEP_DURATION_REDUCED_MS : BUILD_STEP_DURATION_MS,
    );
    return () => window.clearTimeout(timeout);
  }, [run]);

  const stepStatus = (stepIndex: number): BuildStepStatus => {
    if (run === null || stepIndex > run.completedSteps) {
      return "pending";
    }
    return stepIndex < run.completedSteps ? "done" : "running";
  };

  return {
    job: run?.job ?? null,
    isRunning: run !== null && !isComplete,
    isComplete,
    stepStatus,
    start: (job) => setRun({ job, completedSteps: 0 }),
  };
}
