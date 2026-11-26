import { cn } from "cn";
import { CopyButton } from "./copy-button";

interface CopyFieldProps {
  /** Short uppercase tag before the value, e.g. "MCP" or "GET". */
  label: string;
  value: string;
  /** Accessible name of the copy action. */
  copyLabel: string;
  className?: string;
}

/** A single copyable machine value (URL, key, command) with a leading tag. */
export function CopyField({ label, value, copyLabel, className }: CopyFieldProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl bg-ink-50 py-1.5 pr-1.5 pl-3 ring-1 ring-border",
        className,
      )}
    >
      <span className="rounded-md bg-background px-1.5 py-0.5 font-semibold text-[0.6875rem] text-ink-700 ring-1 ring-border">
        {label}
      </span>
      <code className="min-w-0 flex-1 truncate font-mono text-ink-900 text-sm">{value}</code>
      <CopyButton value={value} label={copyLabel} />
    </div>
  );
}
