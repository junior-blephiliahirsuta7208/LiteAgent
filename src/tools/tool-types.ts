export type GenericToolResult = {
  message?: string;
  [key: string]: unknown;
};

type ToolAction = "run_command" | "patch_file";
type ToolStatus = "completed" | "skipped" | "rejected";

type ToolResultBase<
  TAction extends ToolAction,
  TStatus extends ToolStatus,
  TReason extends string,
> = {
  action: TAction;
  status: TStatus;
  reason: TReason;
  message: string;
};

export type RunCommandToolResult =
  | (ToolResultBase<"run_command", "completed", "executed"> & {
      command: string;
      stdout: string;
      stderr: string;
      exitCode: number | null;
      timedOut: boolean;
    })
  | (ToolResultBase<"run_command", "rejected", "approval_required" | "approval_denied"> & {
      command: string;
      approved: false;
      skipped: true;
    });

export type PatchFileToolResult =
  | (ToolResultBase<"patch_file", "completed", "applied"> & {
      path: string;
      diff: string;
      applied: true;
    })
  | (ToolResultBase<"patch_file", "skipped", "no_changes"> & {
      path: string;
      diff: string;
      applied: false;
      skipped: true;
    })
  | (ToolResultBase<"patch_file", "rejected", "approval_required" | "approval_denied"> & {
      path: string;
      diff: string;
      applied: false;
      skipped: true;
    });

export type LoadSkillToolResult =
  | {
      found: true;
      skillName: string;
      entryPath?: string;
      description?: string;
      content: string;
      message?: string;
      availableSkills?: undefined;
      errors?: undefined;
    }
  | {
      found: false;
      skillName: string;
      entryPath?: undefined;
      description?: undefined;
      content?: undefined;
      message: string;
      availableSkills: string[];
      errors: string[];
    };

export type ToolResult = RunCommandToolResult | PatchFileToolResult | LoadSkillToolResult | GenericToolResult;

export function isRunCommandToolResult(result: ToolResult): result is RunCommandToolResult {
  return "action" in result && result.action === "run_command";
}

export function isPatchFileToolResult(result: ToolResult): result is PatchFileToolResult {
  return "action" in result && result.action === "patch_file";
}

export type ToolDefinition<TResult extends ToolResult = ToolResult> = {
  name: string;
  description: string;
  inputSchema: object;
  run(args: unknown): Promise<TResult>;
};
