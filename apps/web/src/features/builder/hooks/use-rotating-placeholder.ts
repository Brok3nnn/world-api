"use client";

import { useEffect, useState } from "react";

const ROTATION_INTERVAL_MS = 3_500;

/** Cycles through `placeholders` while `active` (typically: while the field is empty). */
export function useRotatingPlaceholder(placeholders: readonly string[], active: boolean): string {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!active || placeholders.length < 2) {
      return;
    }
    const interval = window.setInterval(
      () => setIndex((current) => (current + 1) % placeholders.length),
      ROTATION_INTERVAL_MS,
    );
    return () => window.clearInterval(interval);
  }, [active, placeholders.length]);

  return placeholders[index] ?? "";
}
