import { ArrowRightIcon, DatabaseIcon, HammerIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { sampleCreditCosts } from "@/config/site";
import { formatCredits, formatNumber } from "@/lib/format";
import type { Viewer } from "../types";
import { SettingsRow } from "./settings-row";
import { SettingsSection } from "./settings-section";

const [minBuildCredits, maxBuildCredits] = sampleCreditCosts.newEndpoint;

const CREDIT_PRICES = [
  {
    icon: DatabaseIcon,
    title: "Source call",
    price: formatCredits(sampleCreditCosts.perSourceCall),
  },
  {
    icon: SparklesIcon,
    title: "Model answer",
    price: formatCredits(sampleCreditCosts.perModelAnswer),
  },
  {
    icon: HammerIcon,
    title: "New API",
    price: `${formatNumber(minBuildCredits)}–${formatCredits(maxBuildCredits)}`,
  },
] as const;

interface SettingsCreditsProps {
  viewer: Viewer;
}

/** A sample credit balance, and what the common actions would cost in credits. */
export function SettingsCredits({ viewer }: SettingsCreditsProps) {
  const creditsShare = (viewer.creditsRemaining / viewer.monthlyFreeCredits) * 100;

  return (
    <SettingsSection id="credits" description="Sample balance and costs. Nothing is charged.">
      <div className="flex flex-col gap-3 rounded-xl bg-lilac-50 p-4 ring-1 ring-lilac-100 md:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="flex items-baseline gap-2">
            <span className="font-heading text-5xl text-ink-950 tabular-nums">
              {formatNumber(viewer.creditsRemaining)}
            </span>
            <span className="font-medium text-ink-700 text-sm">credits left</span>
          </p>
          <p className="text-muted-foreground text-sm">
            of {formatNumber(viewer.monthlyFreeCredits)} free this month
          </p>
        </div>
        <Progress
          aria-label="Free credits left this month"
          value={Math.min(100, creditsShare)}
          indicatorClassName="bg-violet-600"
          className="*:data-[slot=progress-track]:h-2 *:data-[slot=progress-track]:bg-background"
        />
      </div>

      <ul className="divide-y">
        {CREDIT_PRICES.map(({ icon, title, price }) => (
          <SettingsRow key={title} icon={icon} title={title}>
            <span className="font-semibold text-ink-950 text-sm tabular-nums">{price}</span>
          </SettingsRow>
        ))}
      </ul>

      <Button
        variant="tint"
        size="sm"
        nativeButton={false}
        render={<Link href="/docs#credits" />}
        className="self-start"
      >
        How credits work
        <ArrowRightIcon aria-hidden data-icon="inline-end" />
      </Button>
    </SettingsSection>
  );
}
