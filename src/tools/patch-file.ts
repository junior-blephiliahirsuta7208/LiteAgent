import { readFile } from "node:fs/promises";

import type { PatchFileToolResult, ToolDefinition } from "./tool-types";
import {
  createCompletedToolResult,
  createRejectedToolResult,
  createSkippedToolResult,
} from "./tool-result-helpers";
import { safeResolveWorkspacePath } from "../workspace/fs";
import { applyApprovedPatch, buildUnifiedDiffPreview } from "../workspace/patch";

type PatchFileToolOptions = {
  cwd: string;
  confirm?: (input: { path: string; diff: string }) => Promise<boolean>;
};

export function createPatchFileTool(options: PatchFileToolOptions): ToolDefinition<PatchFileToolResult> {
  return {
    name: "patch_file",
    description: "生成文件 diff 并在批准后写入",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
        },
        nextContent: {
          type: "string",
        },
      },
      required: ["path", "nextContent"],
      additionalProperties: false,
    },
    async run(args) {
      const input = typeof args === "object" && args !== null ? (args as {
        path?: string;
        nextContent?: string;
        approved?: boolean;
      }) : {};

      const resolvedPath = safeResolveWorkspacePath(options.cwd, input.path ?? "");
      const before = await readFile(resolvedPath, "utf8").catch((error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") {
          return "";
        }

        throw error;
      });
      const after = input.nextContent ?? before;
      const diff = buildUnifiedDiffPreview(before, after, input.path ?? resolvedPath);
      const changed = before !== after;

      if (changed) {
        if (!options.confirm) {
          return createRejectedToolResult(
            "patch_file",
            "approval_required",
            "文件变更需要批准，但当前环境无法发起审批，已跳过。",
            {
              path: resolvedPath,
              diff,
              applied: false as const,
              skipped: true as const,
            },
          );
        }

        const approved = await options.confirm?.({
          path: input.path ?? resolvedPath,
          diff,
        });

        if (approved === false) {
          return createRejectedToolResult(
            "patch_file",
            "approval_denied",
            "文件变更未获批准，已跳过。",
            {
              path: resolvedPath,
              diff,
              applied: false as const,
              skipped: true as const,
            },
          );
        }
      }

      if (changed) {
        await applyApprovedPatch(resolvedPath, after);

        return createCompletedToolResult("patch_file", "applied", "文件变更已写入。", {
          path: resolvedPath,
          diff,
          applied: true as const,
        });
      }

      return createSkippedToolResult("patch_file", "no_changes", "文件内容无变化，已跳过写入。", {
        path: resolvedPath,
        diff,
        applied: false as const,
        skipped: true as const,
      });
    },
  };
}
