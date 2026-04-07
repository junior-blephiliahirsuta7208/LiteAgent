import type { ToolDefinition } from "./tool-types";
import { searchWorkspaceText } from "../workspace/fs";

export function createGrepFilesTool(cwd: string): ToolDefinition {
  return {
    name: "grep_files",
    description: "在工作区中搜索文本",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
    async run(args) {
      const query = typeof args === "object" && args !== null ? (args as { query?: string }).query : undefined;

      return {
        matches: await searchWorkspaceText(cwd, query ?? ""),
      };
    },
  };
}
