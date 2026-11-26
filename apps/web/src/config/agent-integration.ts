import { siteConfig } from "./site";

/** The two tools of the MCP server. Kept small so agents' context never fills with tool specs. */
export const MCP_TOOLS = [
  { signature: "search(query)", description: "Finds catalog endpoints. Free." },
  {
    signature: "get(query, shape, max_price)",
    description: "Answers from the catalog, or starts a build when nothing matches.",
  },
] as const;

/** Configuration snippet for MCP clients that connect over Streamable HTTP. */
export const MCP_CLIENT_CONFIG = JSON.stringify(
  { mcpServers: { data: { type: "http", url: siteConfig.mcpUrl } } },
  null,
  2,
);
