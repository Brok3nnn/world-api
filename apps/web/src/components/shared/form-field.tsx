import { cn } from "cn";
import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

/** Props that wire a control to its label, hint and error. */
export interface FieldControlProps {
  id: string;
  "aria-invalid": true | undefined;
  "aria-describedby": string | undefined;
}

interface FormFieldProps {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  /** Receives the props that wire the control to its label, hint and error. */
  children: (control: FieldControlProps) => ReactNode;
  className?: string;
}

/** Label, control, hint and inline error with correct ARIA wiring. */
export function FormField({ id, label, hint, error, children, className }: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy })}
      {hint ? (
        <p id={hintId} className="text-muted-foreground text-xs">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-destructive text-xs">
          {error}
        </p>
      ) : null}
    </div>
  );
}
