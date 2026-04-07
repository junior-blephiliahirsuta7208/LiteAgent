import type { ToolDefinition } from "./tool-types";
import { listWorkspaceFiles } from "../workspace/fs";

export function createListFilesTool(cwd: string): ToolDefinition {
  return {
    name: "list_files",
    description: "列出工作区中的文件",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    async run() {
      return {
        files: await listWorkspaceFiles(cwd),
      };
    },
  };
}
