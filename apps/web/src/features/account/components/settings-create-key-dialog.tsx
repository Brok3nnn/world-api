"use client";

import { PlusIcon } from "lucide-react";
import { type FormEvent, useState } from "react";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface SettingsCreateKeyDialogProps {
  /** Called with the trimmed, non-empty name the visitor chose. */
  onCreate: (name: string) => void;
}

const KEY_NAME_MAX_LENGTH = 32;

/** The "Create key" button and the dialog that asks what to call the new key. */
export function SettingsCreateKeyDialog({ onCreate }: SettingsCreateKeyDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const trimmedName = name.trim();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!trimmedName) {
      return;
    }
    onCreate(trimmedName);
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      // Clear the field only after the dialog has closed, so it does not empty while fading out.
      onOpenChangeComplete={(nowOpen) => (nowOpen ? undefined : setName(""))}
    >
      <DialogTrigger render={<Button variant="outline" />}>
        <PlusIcon aria-hidden data-icon="inline-start" />
        Create key
      </DialogTrigger>
      <DialogContent className="gap-5 p-6 sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading text-ink-950 text-xl">Create a key</DialogTitle>
          <DialogDescription>Name it after the app that will use it.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
          <FormField id="settings-key-name" label="Key name">
            {(control) => (
              <Input
                {...control}
                required
                autoComplete="off"
                maxLength={KEY_NAME_MAX_LENGTH}
                placeholder="Weather dashboard"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-9"
              />
            )}
          </FormField>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" variant="brand" disabled={!trimmedName}>
              Create key
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
