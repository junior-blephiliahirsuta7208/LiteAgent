import type { RuntimeExtension } from "./base";

export function createMcpExtension(enabled: boolean): RuntimeExtension {
  return {
    name: "mcp",
    enabled,
    description: enabled
      ? "MCP 扩展已启用，运行时允许注入模型上下文协议相关能力。"
      : "MCP 扩展未启用。",
    systemPrompt: enabled
      ? [
          "MCP extension is enabled.",
          "If MCP-backed capabilities are available in the runtime, prefer using them through the registered extension surface instead of inventing unavailable tools.",
        ].join(" ")
      : undefined,
  };
}
