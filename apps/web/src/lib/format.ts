const compactNumber = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const groupedNumber = new Intl.NumberFormat("en-US");

const relativeTime = new Intl.RelativeTimeFormat("en-US", { numeric: "auto", style: "short" });

/** 12_400 → "12.4K" */
export function formatCompactNumber(value: number): string {
  return compactNumber.format(value);
}

/** 12400 → "12,400" */
export function formatNumber(value: number): string {
  return groupedNumber.format(value);
}

/** 0.9987 → "99.87%" */
export function formatPercent(ratio: number, fractionDigits = 1): string {
  return `${(ratio * 100).toFixed(fractionDigits)}%`;
}

/** 0.34 → "+34%", -0.04 → "−4%" (true minus sign). */
export function formatSignedPercent(ratio: number, fractionDigits = 0): string {
  const sign = ratio >= 0 ? "+" : "−";
  return `${sign}${formatPercent(Math.abs(ratio), fractionDigits)}`;
}

/** 1 → "1 credit", 1500 → "1,500 credits" */
export function formatCredits(value: number): string {
  return `${formatNumber(value)} ${value === 1 ? "credit" : "credits"}`;
}

const RELATIVE_UNITS: readonly [Intl.RelativeTimeFormatUnit, number][] = [
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
  ["second", 1],
];

/**
 * Formats `date` relative to `now`. `now` is explicit so server and client render the same
 * string and prerendering never reads the clock.
 */
export function formatRelativeTime(date: string | Date, now: string | Date): string {
  const seconds = Math.round((new Date(date).getTime() - new Date(now).getTime()) / 1000);
  for (const [unit, unitSeconds] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= unitSeconds || unit === "second") {
      return relativeTime.format(Math.round(seconds / unitSeconds), unit);
    }
  }
  return relativeTime.format(0, "second");
}

/** Date → "2026-11-21T11:49:10Z": ISO 8601 in UTC at second precision, as used in API responses. */
export function formatIsoSeconds(date: Date): string {
  return `${date.toISOString().slice(0, 19)}Z`;
}

const monthYear = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** "2026-10-05T00:00:00Z" → "Oct 2026" */
export function formatMonthYear(date: string | Date): string {
  return monthYear.format(new Date(date));
}
