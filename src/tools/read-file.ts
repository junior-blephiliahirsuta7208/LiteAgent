import type { ToolDefinition } from "./tool-types";
import { readWorkspaceFile } from "../workspace/fs";

export function createReadFileTool(cwd: string): ToolDefinition {
  return {
    name: "read_file",
    description: "读取工作区文件内容",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
        },
      },
      required: ["path"],
      additionalProperties: false,
    },
    async run(args) {
      const targetPath = typeof args === "object" && args !== null ? (args as { path?: string }).path : undefined;

      return await readWorkspaceFile(cwd, targetPath ?? "");
    },
  };
}
