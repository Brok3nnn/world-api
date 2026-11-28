import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep `next dev` from writing AGENTS.md when an AI coding agent runs it.
  agentRules: false,
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  typedRoutes: true,
  devIndicators: { position: "bottom-right" },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
