"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { SCHEMA_FIELD_TYPE_IDS, SCHEMA_FIELD_TYPES } from "../constants";
import type { SchemaField } from "../types";

interface SchemaFieldEditorProps {
  /** Prefix for element ids; keeps several editors on one page distinct. */
  id: string;
  legend: string;
  fields: readonly SchemaField[];
  onChange: (fields: SchemaField[]) => void;
  error?: string;
}

/** Editable list of output fields (name + type) for custom schemas and response rules. */
export function SchemaFieldEditor({ id, legend, fields, onChange, error }: SchemaFieldEditorProps) {
  const errorId = error ? `${id}-error` : undefined;

  const updateField = (fieldId: string, patch: Partial<SchemaField>) =>
    onChange(fields.map((field) => (field.id === fieldId ? { ...field, ...patch } : field)));

  const removeField = (fieldId: string) => onChange(fields.filter((field) => field.id !== fieldId));

  const addField = () =>
    onChange([...fields, { id: crypto.randomUUID(), name: "", type: "number" }]);

  return (
    <fieldset className="flex flex-col gap-2" aria-describedby={errorId}>
      <legend className="mb-2 font-medium text-sm">{legend}</legend>
      <ul className="flex flex-col gap-2">
        {fields.map((field, index) => (
          <li key={field.id} className="flex items-center gap-2">
            <Input
              value={field.name}
              onChange={(event) => updateField(field.id, { name: event.target.value })}
              placeholder="field_name"
              aria-label={`Field ${index + 1} name`}
              aria-invalid={error ? true : undefined}
              className="h-9 flex-1 font-mono"
              autoComplete="off"
              spellCheck={false}
            />
            <Select
              value={field.type}
              onValueChange={(type) => {
                if (type !== null) {
                  updateField(field.id, { type });
                }
              }}
            >
              <SelectTrigger aria-label={`Field ${index + 1} type`} className="h-9 w-28">
                {SCHEMA_FIELD_TYPES[field.type]}
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {SCHEMA_FIELD_TYPE_IDS.map((type) => (
                  <SelectItem key={type} value={type}>
                    {SCHEMA_FIELD_TYPES[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove field ${index + 1}`}
              disabled={fields.length === 1}
              onClick={() => removeField(field.id)}
            >
              <Trash2Icon aria-hidden />
            </Button>
          </li>
        ))}
      </ul>
      <Button type="button" variant="outline" size="sm" onClick={addField} className="self-start">
        <PlusIcon aria-hidden data-icon="inline-start" />
        Add field
      </Button>
      {error ? (
        <p id={errorId} className="text-destructive text-xs">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
