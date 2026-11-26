"use client";

import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import type { PublishStepProps } from "../types";

/** The one input the chosen connection needs. A push needs none: the key comes after review. */
export function PublishConnectionInput({ draft, errors, onChange }: PublishStepProps) {
  switch (draft.connection) {
    case "push":
      return null;
    case "pull":
      return (
        <FormField
          id="publish-source-url"
          label="Link to your data"
          hint="Fetched only when an update is due."
          error={errors.sourceUrl}
        >
          {(control) => (
            <Input
              {...control}
              type="url"
              inputMode="url"
              value={draft.sourceUrl}
              onChange={(event) => onChange({ sourceUrl: event.target.value })}
              placeholder="https://example.org/camera/latest.jpg"
              className="h-9"
            />
          )}
        </FormField>
      );
    case "file":
      return (
        <FormField
          id="publish-file"
          label="File"
          hint={draft.fileName ? `Selected: ${draft.fileName}` : "CSV, JSON or spreadsheet."}
          error={errors.fileName}
        >
          {(control) => (
            <Input
              {...control}
              type="file"
              accept=".csv,.json,.xlsx"
              onChange={(event) => onChange({ fileName: event.target.files?.[0]?.name ?? "" })}
              className="h-9"
            />
          )}
        </FormField>
      );
    case "api-key":
      return (
        <FormField
          id="publish-api-key"
          label="API key"
          hint="Stored encrypted, used only to fetch."
          error={errors.apiKey}
        >
          {(control) => (
            <Input
              {...control}
              type="password"
              value={draft.apiKey}
              onChange={(event) => onChange({ apiKey: event.target.value })}
              autoComplete="off"
              spellCheck={false}
              className="h-9"
            />
          )}
        </FormField>
      );
  }
}
