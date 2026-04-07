import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import type { RuntimeExtension, RuntimeExtensionItem } from "./base";

type McpConfigShape = {
  mcpServers?: Record<string, Record<string, unknown>>;
  servers?: Record<string, Record<string, unknown>>;
};

function discoverMcpServers(cwd: string): RuntimeExtensionItem[] {
  const candidates = ["liteagent.mcp.json", ".mcp.json"];

  for (const fileName of candidates) {
    const filePath = path.join(cwd, fileName);

    if (!existsSync(filePath)) {
      continue;
    }

    try {
      const parsed = JSON.parse(readFileSync(filePath, "utf8")) as McpConfigShape;
      const servers = parsed.mcpServers ?? parsed.servers ?? {};

      return Object.entries(servers).map(([name, config]) => ({
        name,
        source: fileName,
        transport:
          typeof config.transport === "string"
            ? config.transport
            : typeof config.url === "string"
              ? "http"
              : "stdio",
      }));
    } catch {
      return [];
    }
  }

  return [];
}

export function createMcpExtension(
  enabled: boolean,
  cwd = process.cwd(),
): RuntimeExtension {
  const items = enabled ? discoverMcpServers(cwd) : [];

  return {
    name: "mcp",
    enabled,
    description: enabled
      ? `MCP 扩展已启用，发现 ${items.length} 个 MCP 服务配置。`
      : "MCP 扩展未启用。",
    items,
    systemPrompt: enabled
      ? [
          "MCP extension is enabled.",
          items.length > 0
            ? `Configured MCP servers: ${items.map((item) => item.name).join(", ")}.`
            : "No MCP server configuration was discovered.",
          "If MCP-backed capabilities are available in the runtime, prefer using them through the registered extension surface instead of inventing unavailable tools.",
        ].join(" ")
      : undefined,
  };
}
