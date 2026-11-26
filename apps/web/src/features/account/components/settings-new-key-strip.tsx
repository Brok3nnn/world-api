"use client";

import { XIcon } from "lucide-react";
import { CopyButton } from "@/components/shared/copy-button";
import { Button } from "@/components/ui/button";

interface SettingsNewKeyStripProps {
  /** The full key. This strip is the only place it is ever shown. */
  value: string;
  onHide: () => void;
}

/** Highlighted strip that shows a freshly created key once, with a copy action. */
export function SettingsNewKeyStrip({ value, onHide }: SettingsNewKeyStripProps) {
  return (
    <div
      aria-live="polite"
      className="flex flex-col gap-3 rounded-xl bg-lilac-50 p-4 ring-1 ring-lilac-100"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <p className="font-medium text-ink-950 text-sm">Your new key</p>
          <p className="text-ink-700 text-xs">Copy it now. You will not see it again.</p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Hide new key"
          onClick={onHide}
          className="-mt-1 -mr-1 hover:bg-lilac-100"
        >
          <XIcon aria-hidden />
        </Button>
      </div>
      <div className="flex items-center gap-3 rounded-lg bg-background py-1.5 pr-1.5 pl-3 ring-1 ring-lilac-100">
        <code className="min-w-0 flex-1 break-all font-mono text-ink-950 text-sm">{value}</code>
        <CopyButton value={value} label="Copy new API key" text="Copy" variant="tint" />
      </div>
    </div>
  );
}
