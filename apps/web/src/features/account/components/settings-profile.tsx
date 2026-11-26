"use client";

import { LockIcon } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";
import { PublisherAvatar } from "@/features/catalog/components/publisher-avatar";
import { useSession } from "../hooks/use-session";
import {
  BIO_MAX_LENGTH,
  DISPLAY_NAME_MAX_LENGTH,
  DISPLAY_NAME_MIN_LENGTH,
  isValidDisplayName,
} from "../lib/profile-rules";
import type { Viewer } from "../types";
import { SettingsSection } from "./settings-section";

interface SettingsProfileProps {
  viewer: Viewer;
  /** The bio stored with the account, shown until the visitor saves their own. */
  storedBio: string;
}

/** Display name and bio editor. The handle is fixed, so it is shown locked. */
export function SettingsProfile({ viewer, storedBio }: SettingsProfileProps) {
  const { state, update } = useSession();
  const savedName = state.displayName ?? viewer.displayName;
  const savedBio = state.bio ?? storedBio;
  // `null` means untouched: the field follows the saved value, also once the session has loaded.
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [bioDraft, setBioDraft] = useState<string | null>(null);
  const name = nameDraft ?? savedName;
  const bio = bioDraft ?? savedBio;
  const nameValid = isValidDisplayName(name);
  const changed = name.trim() !== savedName || bio.trim() !== savedBio;

  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!changed || !nameValid) {
      return;
    }
    update({ displayName: name.trim(), bio: bio.trim() });
    setNameDraft(null);
    setBioDraft(null);
    toast.success("Profile saved");
  };

  return (
    <SettingsSection id="profile" description="Shown on your public profile.">
      <form onSubmit={save} noValidate className="flex flex-col gap-5 sm:flex-row sm:gap-6">
        <PublisherAvatar name={name.trim() || savedName} seed={viewer.handle} size="xl" />

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField
              id="settings-display-name"
              label="Display name"
              error={
                nameValid
                  ? undefined
                  : `Use ${DISPLAY_NAME_MIN_LENGTH} to ${DISPLAY_NAME_MAX_LENGTH} characters.`
              }
            >
              {(control) => (
                <Input
                  {...control}
                  required
                  autoComplete="nickname"
                  minLength={DISPLAY_NAME_MIN_LENGTH}
                  maxLength={DISPLAY_NAME_MAX_LENGTH}
                  value={name}
                  onChange={(event) => setNameDraft(event.target.value)}
                  className="h-9"
                />
              )}
            </FormField>

            <FormField id="settings-handle" label="Handle">
              {(control) => (
                <InputGroup className="h-9 bg-ink-50">
                  <InputGroupInput
                    {...control}
                    readOnly
                    value={`@${viewer.handle}`}
                    className="text-ink-700"
                  />
                  <InputGroupAddon align="inline-end">
                    <LockIcon aria-hidden className="size-3.5" />
                  </InputGroupAddon>
                </InputGroup>
              )}
            </FormField>
          </div>

          <FormField
            id="settings-bio"
            label="Bio"
            hint={
              <span className="block text-right tabular-nums">
                <span aria-hidden>
                  {bio.length}/{BIO_MAX_LENGTH}
                </span>
                <span className="sr-only">
                  {bio.length} of {BIO_MAX_LENGTH} characters used
                </span>
              </span>
            }
          >
            {(control) => (
              <Textarea
                {...control}
                rows={3}
                maxLength={BIO_MAX_LENGTH}
                placeholder="What your APIs are about"
                value={bio}
                onChange={(event) => setBioDraft(event.target.value)}
                className="min-h-20"
              />
            )}
          </FormField>

          <div className="flex justify-end">
            <Button type="submit" variant="brand" disabled={!changed || !nameValid}>
              Save changes
            </Button>
          </div>
        </div>
      </form>
    </SettingsSection>
  );
}
