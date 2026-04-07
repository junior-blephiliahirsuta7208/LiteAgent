type ToolAction = "run_command" | "patch_file";
type ToolStatus = "completed" | "skipped" | "rejected";

type ToolResultBase = {
  action: ToolAction;
  status: ToolStatus;
  reason: string;
  message: string;
};

export function createCompletedToolResult<T extends Record<string, unknown>>(
  action: ToolAction,
  reason: string,
  message: string,
  extra: T,
): ToolResultBase & T {
  return {
    action,
    status: "completed",
    reason,
    message,
    ...extra,
  };
}

export function createSkippedToolResult<T extends Record<string, unknown>>(
  action: ToolAction,
  reason: string,
  message: string,
  extra: T,
): ToolResultBase & T {
  return {
    action,
    status: "skipped",
    reason,
    message,
    ...extra,
  };
}

export function createRejectedToolResult<T extends Record<string, unknown>>(
  action: ToolAction,
  reason: string,
  message: string,
  extra: T,
): ToolResultBase & T {
  return {
    action,
    status: "rejected",
    reason,
    message,
    ...extra,
  };
}
