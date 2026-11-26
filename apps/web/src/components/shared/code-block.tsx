import { cn } from "cn";
import { CopyButton } from "./copy-button";

interface CodeBlockProps {
  code: string;
  /** Small caption shown in the header bar, e.g. "Response" or "curl". */
  title?: string;
  /** Accessible name of the copy action. */
  copyLabel?: string;
  /** Wraps long lines instead of scrolling sideways; for short commands in narrow panels. */
  wrap?: boolean;
  className?: string;
}

export function CodeBlock({
  code,
  title,
  copyLabel = "Copy code",
  wrap = false,
  className,
}: CodeBlockProps) {
  return (
    <figure
      className={cn("overflow-hidden rounded-xl border bg-ink-950 text-cobalt-50", className)}
    >
      <figcaption className="flex h-10 items-center justify-between border-white/10 border-b pr-1.5 pl-4">
        <span className="font-medium text-white/70 text-xs">{title}</span>
        <CopyButton value={code} label={copyLabel} variant="glass" className="border-transparent" />
      </figcaption>
      <pre
        className={cn(
          "p-4 font-mono text-[0.8125rem] leading-relaxed",
          wrap ? "whitespace-pre-wrap break-all" : "overflow-x-auto",
        )}
      >
        <code>{code}</code>
      </pre>
    </figure>
  );
}
