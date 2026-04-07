import { createMcpClient } from "../extensions/mcp-client";
import { loadMcpConfig } from "../extensions/mcp-config";

type McpCommandOptions = {
  cwd: string;
  homeDir?: string;
  timeoutMs?: number;
};

export type McpCommandResult = {
  output: string;
  exitCode: number;
};

export async function runMcpCommand(
  args: string[],
  options: McpCommandOptions,
): Promise<McpCommandResult> {
  const [subcommand = "list"] = args;
  const config = loadMcpConfig(options.cwd, options.homeDir);

  if (subcommand === "list") {
    return {
      output: formatMcpServerList(config.servers, config.errors),
      exitCode: 0,
    };
  }

  if (subcommand === "tools") {
    return await runMcpToolsCommand(config, options);
  }

  return {
    output: "用法: liteagent mcp <list|tools>",
    exitCode: 1,
  };
}

async function runMcpToolsCommand(
  config: ReturnType<typeof loadMcpConfig>,
  options: McpCommandOptions,
): Promise<McpCommandResult> {
  if (config.servers.length === 0) {
    return {
      output: formatMcpServerList(config.servers, config.errors),
      exitCode: 0,
    };
  }

  const lines = ["当前 MCP tools", ""];

  for (const server of config.servers) {
    lines.push(`${server.name}`);
    lines.push(`  来源：${server.source}`);
    lines.push(`  传输：${server.transport}`);

    if (server.transport !== "stdio" || !server.command) {
      lines.push("  当前暂不支持列出该 transport 的工具");
      lines.push("");
      continue;
    }

    const client = createMcpClient(server, {
      cwd: options.cwd,
      timeoutMs: options.timeoutMs ?? 5000,
    });

    try {
      const tools = await client.listTools();

      if (tools.length === 0) {
        lines.push("  暂无可用工具");
      } else {
        for (const tool of tools) {
          lines.push(`  - ${tool.name}${tool.description ? `: ${tool.description}` : ""}`);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      lines.push(`  读取失败：${message}`);
    } finally {
      await client.close();
    }

    lines.push("");
  }

  if (config.errors.length > 0) {
    lines.push("错误 / 警告");

    for (const error of config.errors) {
      lines.push(`- ${error}`);
    }
  }

  return {
    output: lines.join("\n").trimEnd(),
    exitCode: 0,
  };
}

function formatMcpServerList(
  servers: Array<{ name: string; source: string; transport: string }>,
  errors: string[],
): string {
  if (servers.length === 0) {
    return errors.length > 0
      ? ["暂无 MCP server。", "", "错误 / 警告", ...errors.map((error) => `- ${error}`)].join("\n")
      : "暂无 MCP server。";
  }

  const lines = ["当前 MCP servers", ""];

  for (const [index, server] of servers.entries()) {
    lines.push(`${index + 1}. ${server.name}`);
    lines.push(`   来源：${server.source}`);
    lines.push(`   传输：${server.transport}`);
  }

  if (errors.length > 0) {
    lines.push("");
    lines.push("错误 / 警告");

    for (const error of errors) {
      lines.push(`- ${error}`);
    }
  }

  return lines.join("\n");
}
