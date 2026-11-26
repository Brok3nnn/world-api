"use client";

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

interface SettingsRevokeKeyDialogProps {
  keyName: string;
  onConfirm: () => void;
}

/** The "Revoke" button of one key and the confirmation it asks for before the key is removed. */
export function SettingsRevokeKeyDialog({ keyName, onConfirm }: SettingsRevokeKeyDialogProps) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Revoke ${keyName}`}
            className="text-ink-700"
          />
        }
      >
        Revoke
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="gap-5 p-6 sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading text-ink-950 text-xl">Revoke this key?</DialogTitle>
          <DialogDescription>
            <span className="wrap-anywhere font-medium text-ink-950">{keyName}</span> stops working
            right away. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button variant="destructive" onClick={onConfirm}>
            Revoke key
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
