import type { PublishDraft, PublishDraftErrors, PublishStepId, SchemaField } from "../types";

const MIN_NAME_LENGTH = 3;
const FIELD_NAME_PATTERN = /^[a-z][a-z0-9_]*$/;

/** Errors of one wizard step; an empty object means the step is complete. */
export function validatePublishStep(draft: PublishDraft, step: PublishStepId): PublishDraftErrors {
  switch (step) {
    case "source":
      return validateSource(draft);
    case "response":
      return validateResponse(draft);
    case "price":
      return validatePrice(draft);
    case "review":
      return validateRights(draft);
  }
}

function validateSource(draft: PublishDraft): PublishDraftErrors {
  const errors: PublishDraftErrors = {};
  if (draft.connection === "pull" && !isHttpUrl(draft.sourceUrl)) {
    errors.sourceUrl = "Enter a link that starts with https://";
  }
  if (draft.connection === "api-key" && draft.apiKey.trim() === "") {
    errors.apiKey = "Paste your API key.";
  }
  if (draft.connection === "file" && draft.fileName === "") {
    errors.fileName = "Choose a file.";
  }
  if (draft.name.trim().length < MIN_NAME_LENGTH) {
    errors.name = `Use at least ${MIN_NAME_LENGTH} characters.`;
  }
  if (draft.category === null) {
    errors.category = "Choose a category.";
  }
  return errors;
}

function validateResponse(draft: PublishDraft): PublishDraftErrors {
  const errors: PublishDraftErrors = {};
  if (draft.responseRule.trim() === "") {
    errors.responseRule = "Say what the API may return.";
  }
  const fieldsError = validateFields(draft.fields);
  if (fieldsError) {
    errors.fields = fieldsError;
  }
  return errors;
}

function validatePrice(draft: PublishDraft): PublishDraftErrors {
  return Number.isInteger(draft.priceCredits) && draft.priceCredits >= 1
    ? {}
    : { priceCredits: "Use a whole number of at least 1." };
}

function validateRights(draft: PublishDraft): PublishDraftErrors {
  const errors: PublishDraftErrors = {};
  if (!draft.hasResaleRights) {
    errors.hasResaleRights = "Required to share this data.";
  }
  if (!draft.noPersonalData) {
    errors.noPersonalData = "Required to share this data.";
  }
  return errors;
}

function validateFields(fields: readonly SchemaField[]): string | undefined {
  if (fields.length === 0) {
    return "Add at least one field.";
  }
  if (fields.some((field) => !FIELD_NAME_PATTERN.test(field.name))) {
    return "Use lowercase letters, digits and _, starting with a letter.";
  }
  const names = new Set(fields.map((field) => field.name));
  if (names.size !== fields.length) {
    return "Field names must be unique.";
  }
  return undefined;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
