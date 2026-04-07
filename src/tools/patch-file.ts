import { readFile } from "node:fs/promises";

import type { ToolDefinition } from "./tool-types";
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

export function createPatchFileTool(options: PatchFileToolOptions): ToolDefinition {
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
              applied: false,
              skipped: true,
            },
          );
        }
      }

      if (changed) {
        await applyApprovedPatch(resolvedPath, after);

        return createCompletedToolResult("patch_file", "applied", "文件变更已写入。", {
          path: resolvedPath,
          diff,
          applied: true,
        });
      }

      return createSkippedToolResult("patch_file", "no_changes", "文件内容无变化，已跳过写入。", {
        path: resolvedPath,
        diff,
        applied: false,
        skipped: true,
      });
    },
  };
}
