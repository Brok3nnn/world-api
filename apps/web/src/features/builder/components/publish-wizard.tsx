"use client";

import { ArrowLeftIcon, ArrowRightIcon, SendIcon } from "lucide-react";
import { type FormEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { EMPTY_PUBLISH_DRAFT, PUBLISH_STEP_IDS, PUBLISH_STEPS } from "../constants";
import { validatePublishStep } from "../lib/validate-publish-step";
import type { PublishDraft, PublishDraftErrors, PublishStepId, PublishStepProps } from "../types";
import { PublishPriceStep } from "./publish-price-step";
import { PublishResponseStep } from "./publish-response-step";
import { PublishReviewStep } from "./publish-review-step";
import { PublishSourceStep } from "./publish-source-step";
import { PublishStepper } from "./publish-stepper";
import { PublishSubmitted } from "./publish-submitted";

interface PublishWizardProps {
  publisherHandle: string;
}

/**
 * "Share your data" in four steps. Each step is validated before the next one opens; the last
 * one hands over to a confirmation.
 */
export function PublishWizard({ publisherHandle }: PublishWizardProps) {
  const [draft, setDraft] = useState<PublishDraft>(EMPTY_PUBLISH_DRAFT);
  const [errors, setErrors] = useState<PublishDraftErrors>({});
  const [stepId, setStepId] = useState<PublishStepId>("source");
  const [submittedName, setSubmittedName] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const nextStepId = PUBLISH_STEP_IDS[PUBLISH_STEP_IDS.indexOf(stepId) + 1];
  const previousStepId = PUBLISH_STEP_IDS[PUBLISH_STEP_IDS.indexOf(stepId) - 1];

  const update = (patch: Partial<PublishDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setErrors((current) => withoutKeys(current, Object.keys(patch)));
  };

  // Wait for the new state to render, then move focus where keyboard users expect it.
  const focusAfterRender = (selector: string) =>
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>(selector)?.focus());

  const goTo = (step: PublishStepId) => {
    setErrors({});
    setStepId(step);
    focusAfterRender("h2");
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const stepErrors = validatePublishStep(draft, stepId);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      focusAfterRender('[aria-invalid="true"]');
      return;
    }
    if (nextStepId) {
      goTo(nextStepId);
      return;
    }
    setSubmittedName(draft.name.trim());
    setDraft(EMPTY_PUBLISH_DRAFT);
    setStepId("source");
  };

  if (submittedName !== null) {
    return <PublishSubmitted name={submittedName} onRestart={() => setSubmittedName(null)} />;
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6 rounded-2xl border bg-card p-5 md:p-6">
      <PublishStepper current={stepId} onStepSelect={goTo} />
      <form ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-6">
        <h2 tabIndex={-1} className="font-semibold text-ink-950 text-lg outline-none">
          {PUBLISH_STEPS[stepId].title}
        </h2>
        <PublishStepContent
          stepId={stepId}
          draft={draft}
          errors={errors}
          onChange={update}
          publisherHandle={publisherHandle}
        />
        <div className="flex items-center gap-3 border-t pt-5">
          {previousStepId ? (
            <Button type="button" variant="outline" onClick={() => goTo(previousStepId)}>
              <ArrowLeftIcon aria-hidden data-icon="inline-start" />
              Back
            </Button>
          ) : null}
          <Button type="submit" variant="brand" className="ml-auto">
            {nextStepId ? (
              <>
                Next
                <ArrowRightIcon aria-hidden data-icon="inline-end" />
              </>
            ) : (
              <>
                <SendIcon aria-hidden data-icon="inline-start" />
                Submit for review
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

interface PublishStepContentProps extends PublishStepProps {
  stepId: PublishStepId;
  publisherHandle: string;
}

function PublishStepContent({ stepId, publisherHandle, ...stepProps }: PublishStepContentProps) {
  switch (stepId) {
    case "source":
      return <PublishSourceStep {...stepProps} publisherHandle={publisherHandle} />;
    case "response":
      return <PublishResponseStep {...stepProps} />;
    case "price":
      return <PublishPriceStep {...stepProps} />;
    case "review":
      return <PublishReviewStep {...stepProps} publisherHandle={publisherHandle} />;
  }
}

function withoutKeys(errors: PublishDraftErrors, keys: readonly string[]): PublishDraftErrors {
  return Object.fromEntries(Object.entries(errors).filter(([key]) => !keys.includes(key)));
}
