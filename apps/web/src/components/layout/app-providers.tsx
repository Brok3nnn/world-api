"use client";

import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <NuqsAdapter>
      <TooltipProvider delay={150}>
        {children}
        <Toaster position="bottom-right" />
      </TooltipProvider>
    </NuqsAdapter>
  );
}
