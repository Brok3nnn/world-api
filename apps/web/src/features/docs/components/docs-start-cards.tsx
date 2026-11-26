import { ArrowRightIcon, LinkIcon, type LucideIcon, PlugIcon, SparklesIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

interface StartCard {
  title: string;
  description: string;
  icon: LucideIcon;
  href: Route;
}

const START_CARDS: readonly StartCard[] = [
  {
    title: "Paste a prompt",
    description: "Every API has a ready prompt for your AI tool.",
    icon: SparklesIcon,
    href: "/marketplace",
  },
  {
    title: "Use a link",
    description: "One link per API. It always answers.",
    icon: LinkIcon,
    href: "/docs#parameters",
  },
  {
    title: "Connect an agent",
    description: "One MCP server with two tools.",
    icon: PlugIcon,
    href: "/docs#agents",
  },
];

/** The three ways to start, from least to most technical. */
export function DocsStartCards() {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {START_CARDS.map((card) => {
        const Icon = card.icon;
        return (
          <li key={card.title}>
            <Link
              href={card.href}
              className="group flex h-full flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-border transition-shadow outline-none hover:shadow-float focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-lilac-50 text-violet-700 ring-1 ring-lilac-100">
                <Icon aria-hidden className="size-5" />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="inline-flex items-center gap-1 font-semibold text-ink-950">
                  {card.title}
                  <ArrowRightIcon
                    aria-hidden
                    className="size-4 text-ink-300 transition-transform group-hover:translate-x-0.5 group-hover:text-violet-600"
                  />
                </span>
                <span className="text-muted-foreground text-sm">{card.description}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
