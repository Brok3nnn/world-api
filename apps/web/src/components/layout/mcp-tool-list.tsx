import { cn } from "cn";
import { MCP_TOOLS } from "@/config/agent-integration";

interface McpToolListProps {
  className?: string;
}

/** The two MCP tools with one-line descriptions. Shown in the agent dialog and in the docs. */
export function McpToolList({ className }: McpToolListProps) {
  return (
    <ul className={cn("grid gap-2 sm:grid-cols-2", className)}>
      {MCP_TOOLS.map((tool) => (
        <li key={tool.signature} className="rounded-xl border p-3">
          <code className="font-mono text-violet-700 text-xs">{tool.signature}</code>
          <p className="mt-1 text-muted-foreground text-xs">{tool.description}</p>
        </li>
      ))}
    </ul>
  );
}
