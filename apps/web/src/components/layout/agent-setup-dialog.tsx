"use client";

import { CodeBlock } from "@/components/shared/code-block";
import { CopyField } from "@/components/shared/copy-field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MCP_CLIENT_CONFIG } from "@/config/agent-integration";
import { siteConfig } from "@/config/site";
import { McpToolList } from "./mcp-tool-list";

interface AgentSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Explains how to connect an AI agent: one MCP server, two tools, plus llms.txt. */
export function AgentSetupDialog({ open, onOpenChange }: AgentSetupDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-6 p-6 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-ink-950">
            Connect your agents
          </DialogTitle>
          <DialogDescription>
            One MCP server with two tools, so thousands of endpoints never flood your agent's
            context.
          </DialogDescription>
        </DialogHeader>

        <CopyField label="MCP" value={siteConfig.mcpUrl} copyLabel="Copy MCP server URL" />

        <McpToolList />

        <CodeBlock
          title="Client config"
          code={MCP_CLIENT_CONFIG}
          copyLabel="Copy MCP client config"
        />

        <p className="text-muted-foreground text-xs">
          Models can read the whole reference in one pass at{" "}
          <code className="font-mono text-ink-900">{siteConfig.llmsTxtUrl}</code>.
        </p>
      </DialogContent>
    </Dialog>
  );
}
