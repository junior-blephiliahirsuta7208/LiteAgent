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
        directory: {
          type: "string",
        },
        limit: {
          type: "number",
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
    async run(args) {
      const input =
        typeof args === "object" && args !== null
          ? (args as { query?: string; directory?: string; limit?: number })
          : {};

      return {
        matches: await searchWorkspaceText(cwd, input.query ?? "", {
          directory: input.directory,
          limit: input.limit,
        }),
      };
    },
  };
}
