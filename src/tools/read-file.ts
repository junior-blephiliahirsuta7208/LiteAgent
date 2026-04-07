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
        startLine: {
          type: "number",
        },
        endLine: {
          type: "number",
        },
      },
      required: ["path"],
      additionalProperties: false,
    },
    async run(args) {
      const input =
        typeof args === "object" && args !== null
          ? (args as { path?: string; startLine?: number; endLine?: number })
          : {};

      return await readWorkspaceFile(cwd, input.path ?? "", {
        startLine: input.startLine,
        endLine: input.endLine,
      });
    },
  };
}
