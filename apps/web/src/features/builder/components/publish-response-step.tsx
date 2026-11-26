"use client";

import { ShieldCheckIcon } from "lucide-react";
import { FormField } from "@/components/shared/form-field";
import { Textarea } from "@/components/ui/textarea";
import type { PublishStepProps } from "../types";
import { SchemaFieldEditor } from "./schema-field-editor";

/** Step 2: the plain-language response rule and the fields it becomes. */
export function PublishResponseStep({ draft, errors, onChange }: PublishStepProps) {
  return (
    <div className="flex flex-col gap-5">
      <FormField
        id="publish-response-rule"
        label="What may the API return?"
        hint="Plain words are fine."
        error={errors.responseRule}
      >
        {(control) => (
          <Textarea
            {...control}
            value={draft.responseRule}
            onChange={(event) => onChange({ responseRule: event.target.value })}
            placeholder="Only how many birds are visible"
            rows={3}
            maxLength={400}
          />
        )}
      </FormField>

      <SchemaFieldEditor
        id="publish-fields"
        legend="Fields"
        fields={draft.fields}
        onChange={(fields) => onChange({ fields })}
        error={errors.fields}
      />

      <p className="flex items-center gap-2 rounded-xl bg-mint-100 p-3 text-mint-600 text-xs">
        <ShieldCheckIcon aria-hidden className="size-4 shrink-0" />
        Only these fields ever leave. Camera frames are deleted.
      </p>
    </div>
  );
}
