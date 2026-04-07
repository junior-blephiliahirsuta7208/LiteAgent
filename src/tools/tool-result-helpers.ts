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

export function createCompletedToolResult<
  TAction extends ToolAction,
  TReason extends string,
  TExtra extends Record<string, unknown>,
>(
  action: TAction,
  reason: TReason,
  message: string,
  extra: TExtra,
): ToolResultBase<TAction, "completed", TReason> & TExtra {
  return {
    action,
    status: "completed",
    reason,
    message,
    ...extra,
  };
}

export function createSkippedToolResult<
  TAction extends ToolAction,
  TReason extends string,
  TExtra extends Record<string, unknown>,
>(
  action: TAction,
  reason: TReason,
  message: string,
  extra: TExtra,
): ToolResultBase<TAction, "skipped", TReason> & TExtra {
  return {
    action,
    status: "skipped",
    reason,
    message,
    ...extra,
  };
}

export function createRejectedToolResult<
  TAction extends ToolAction,
  TReason extends string,
  TExtra extends Record<string, unknown>,
>(
  action: TAction,
  reason: TReason,
  message: string,
  extra: TExtra,
): ToolResultBase<TAction, "rejected", TReason> & TExtra {
  return {
    action,
    status: "rejected",
    reason,
    message,
    ...extra,
  };
}
