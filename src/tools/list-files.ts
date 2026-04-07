import type { ToolDefinition } from "./tool-types";
import { listWorkspaceFiles } from "../workspace/fs";

export function createListFilesTool(cwd: string): ToolDefinition {
  return {
    name: "list_files",
    description: "列出工作区中的文件",
    inputSchema: {
      type: "object",
      properties: {
        directory: {
          type: "string",
        },
        limit: {
          type: "number",
        },
      },
      additionalProperties: false,
    },
    async run(args) {
      const input =
        typeof args === "object" && args !== null
          ? (args as { directory?: string; limit?: number })
          : {};

      return {
        files: await listWorkspaceFiles(cwd, {
          directory: input.directory,
          limit: input.limit,
        }),
      };
    },
  };
}
