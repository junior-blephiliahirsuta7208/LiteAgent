import { shouldRequireApproval } from "../core/permissions";
import { runWorkspaceCommand } from "../workspace/shell";
import {
  createCompletedToolResult,
  createRejectedToolResult,
} from "./tool-result-helpers";
import type { ToolDefinition } from "./tool-types";

type RunCommandToolOptions = {
  cwd: string;
  timeoutMs: number;
  maxOutput: number;
  confirm?: (command: string) => Promise<boolean>;
};

export function createRunCommandTool(options: RunCommandToolOptions): ToolDefinition {
  return {
    name: "run_command",
    description: "在工作区执行命令",
    inputSchema: {
      type: "object",
      properties: {
        command: {
          type: "string",
        },
      },
      required: ["command"],
      additionalProperties: false,
    },
    async run(args) {
      const command =
        typeof args === "object" && args !== null ? (args as { command?: string }).command : undefined;
      const normalizedCommand = command ?? "";

      if (shouldRequireApproval(normalizedCommand)) {
        if (!options.confirm) {
          return createRejectedToolResult(
            "run_command",
            "approval_required",
            "命令需要批准，但当前环境无法发起审批，已跳过。",
            {
              command: normalizedCommand,
              approved: false,
              skipped: true,
            },
          );
        }

        const approved = await options.confirm(normalizedCommand);

        if (!approved) {
          return createRejectedToolResult(
            "run_command",
            "approval_denied",
            "命令执行未获批准，已跳过。",
            {
              command: normalizedCommand,
              approved: false,
              skipped: true,
            },
          );
        }
      }

      const result = await runWorkspaceCommand({
        command: normalizedCommand,
        cwd: options.cwd,
        timeoutMs: options.timeoutMs,
        maxOutput: options.maxOutput,
      });

      return createCompletedToolResult("run_command", "executed", "命令已执行。", {
        command: normalizedCommand,
        ...result,
      });
    },
  };
}
