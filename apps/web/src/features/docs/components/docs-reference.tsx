import { McpToolList } from "@/components/layout/mcp-tool-list";
import { CodeBlock } from "@/components/shared/code-block";
import { ContentSection } from "@/components/shared/content-section";
import { CopyField } from "@/components/shared/copy-field";
import { MCP_CLIENT_CONFIG } from "@/config/agent-integration";
import { siteConfig } from "@/config/site";
import {
  CREDIT_PRICES,
  PARAMETERS,
  PERMANENT_URL_SNIPPET,
  QUICKSTART_SNIPPET,
  RESPONSE_EXAMPLE,
  RESPONSE_FIELDS,
} from "../constants";
import { ErrorCodeTable } from "./error-code-table";
import { ReferenceTable } from "./reference-table";

/** The complete single-page API reference. Section ids match `DOC_SECTIONS`. */
export function DocsReference() {
  return (
    <div className="flex min-w-0 flex-col gap-14">
      <ContentSection
        id="quickstart"
        title="Quickstart"
        description="Planned: ask in plain language and get a working answer. Every answer comes with a permanent URL you can call directly from then on."
      >
        <CodeBlock
          title="Ask anything (planned)"
          code={QUICKSTART_SNIPPET}
          copyLabel="Copy quickstart"
        />
        <CodeBlock
          title="Call the permanent URL"
          code={PERMANENT_URL_SNIPPET}
          copyLabel="Copy permanent URL example"
        />
      </ContentSection>

      <ContentSection
        id="parameters"
        title="One endpoint, a few parameters"
        description="Every endpoint is a GET URL. Public free endpoints also work without a key at a lower rate limit."
      >
        <CopyField
          label="GET"
          value={`${siteConfig.apiBaseUrl}/@owner/endpoint`}
          copyLabel="Copy URL pattern"
        />
        <ReferenceTable caption="Query parameters" nameHeading="Parameter" rows={PARAMETERS} />
      </ContentSection>

      <ContentSection
        id="response"
        title="Response"
        description="Every JSON response uses the same envelope, so your tools only learn it once."
      >
        <CodeBlock title="Response" code={RESPONSE_EXAMPLE} copyLabel="Copy example response" />
        <ReferenceTable caption="Response fields" nameHeading="Field" rows={RESPONSE_FIELDS} />
      </ContentSection>

      <ContentSection
        id="errors"
        title="Errors"
        description="Failed or schema-invalid responses are never billed."
      >
        <ErrorCodeTable />
      </ContentSection>

      <ContentSection
        id="credits"
        title="Credits"
        description="The planned unit of price. Sample costs; nothing is charged."
      >
        <ReferenceTable
          caption="Sample credit costs"
          nameHeading="Item"
          rows={CREDIT_PRICES}
          monospaceNames={false}
        />
      </ContentSection>

      <ContentSection
        id="agents"
        title="Agents"
        description="Planned: one MCP server with two tools. The same server connects to any MCP-capable assistant."
      >
        <CopyField label="MCP" value={siteConfig.mcpUrl} copyLabel="Copy MCP server URL" />
        <McpToolList />
        <CodeBlock
          title="Client config"
          code={MCP_CLIENT_CONFIG}
          copyLabel="Copy MCP client config"
        />
        <CopyField label="TXT" value={siteConfig.llmsTxtUrl} copyLabel="Copy llms.txt URL" />
      </ContentSection>
    </div>
  );
}
