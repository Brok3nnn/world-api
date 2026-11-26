"use client";

import { Checkbox } from "@/components/ui/checkbox";
import type { PublishDraft, PublishStepProps } from "../types";

type RightsKey = keyof Pick<PublishDraft, "hasResaleRights" | "noPersonalData">;

const RIGHTS: readonly { key: RightsKey; label: string }[] = [
  { key: "hasResaleRights", label: "I may share and sell this data." },
  { key: "noPersonalData", label: "No personal data leaves this API." },
];

/** The two confirmations every publisher gives before submitting. */
export function PublishRightsChecklist({ draft, errors, onChange }: PublishStepProps) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="sr-only">Confirm your rights</legend>
      {RIGHTS.map(({ key, label }) => {
        const id = `publish-${key}`;
        const errorId = `${id}-error`;
        return (
          <div key={key} className="flex flex-col gap-1.5">
            <div className="flex items-start gap-3">
              <Checkbox
                id={id}
                checked={draft[key]}
                onCheckedChange={(checked) => onChange(rightsPatch(key, checked))}
                aria-invalid={errors[key] ? true : undefined}
                aria-describedby={errors[key] ? errorId : undefined}
                className="mt-0.5"
              />
              <label htmlFor={id} className="cursor-pointer text-ink-800 text-sm">
                {label}
              </label>
            </div>
            {errors[key] ? (
              <p id={errorId} className="pl-7 text-destructive text-xs">
                {errors[key]}
              </p>
            ) : null}
          </div>
        );
      })}
    </fieldset>
  );
}

function rightsPatch(key: RightsKey, value: boolean): Partial<PublishDraft> {
  const patch: Partial<PublishDraft> = {};
  patch[key] = value;
  return patch;
}
