"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface CopyButtonProps {
  value: string;
  /** Accessible name, e.g. "Copy endpoint URL". */
  label: string;
  /** Visible text next to the icon. Without it the button is icon-only. */
  text?: string;
  variant?: "ghost" | "glass" | "outline" | "secondary" | "tint" | "brand";
  className?: string;
}

const RESET_AFTER_MS = 1600;

export function CopyButton({ value, label, text, variant = "ghost", className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timeout = window.setTimeout(() => setCopied(false), RESET_AFTER_MS);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      toast.error("Copy failed. Select the text and copy it manually.");
    }
  };

  const Icon = copied ? CheckIcon : CopyIcon;

  return (
    <Button
      type="button"
      size={text ? "sm" : "icon-sm"}
      variant={variant}
      aria-label={label}
      onClick={copy}
      className={className}
    >
      <Icon aria-hidden data-icon={text ? "inline-start" : undefined} />
      {text ? <span aria-hidden>{copied ? "Copied" : text}</span> : null}
    </Button>
  );
}
