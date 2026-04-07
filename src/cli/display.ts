import type { ConfigIssue } from "../config/validation";
import {
  isPatchFileToolResult,
  isRunCommandToolResult,
  type ToolResult,
} from "../tools/tool-types";

export type WelcomeMessageInput = {
  cwd: string;
  model: string;
  sessionId?: string;
};

export type StatusSummaryInput = {
  cwd: string;
  model: string;
  status: "idle" | "running";
  sessionId?: string;
  historyCount?: number;
};

export type RunCommandApprovalPromptInput = {
  command: string;
};

export type PatchFileApprovalPromptInput = {
  path: string;
  diff: string;
};

type DiffStats = {
  additions: number;
  deletions: number;
};

export function formatWelcomeMessage(input: WelcomeMessageInput): string {
  const lines = [
    "欢迎使用 LiteAgent",
    `当前目录：${input.cwd}`,
    `当前模型：${input.model}`,
  ];

  if (input.sessionId) {
    lines.push(`当前会话：${input.sessionId}`);
  }

  lines.push("直接输入需求即可开始，输入 /help 查看命令，输入 /exit 结束。");

  return lines.join("\n");
}

export function formatConfigIssueReport(issues: ConfigIssue[]): string {
  if (issues.length === 0) {
    return "当前配置校验通过。";
  }

  const lines = ["配置校验失败，当前无法启动 LiteAgent：", ""];

  for (const issue of issues) {
    lines.push(`- [${issue.path}] ${issue.message}`);

    if (issue.received) {
      lines.push(`  当前值：${issue.received}`);
    }

    lines.push(`  建议：${issue.suggestion}`);
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}

export function formatStatusSummary(input: StatusSummaryInput): string {
  const lines = [
    input.status === "running" ? "当前正在处理你的请求。" : "当前空闲，随时可以继续。",
    `模型：${input.model}`,
    `目录：${input.cwd}`,
  ];

  if (input.sessionId) {
    lines.push(`会话：${input.sessionId}`);
  }

  if (typeof input.historyCount === "number") {
    lines.push(`已记录 ${input.historyCount} 条对话。`);
  }

  return lines.join("\n");
}

export function formatRunCommandApprovalPrompt(
  input: RunCommandApprovalPromptInput,
): string {
  return [
    "这一步需要你确认后我再继续。",
    "准备执行命令：",
    input.command,
    "这类操作可能会改动环境、联网或写入结果，请确认是否继续。",
  ].join("\n");
}

export function formatPatchFileApprovalPrompt(
  input: PatchFileApprovalPromptInput,
): string {
  const stats = getDiffStats(input.diff);

  return [
    `准备更新文件：${input.path}`,
    `变更摘要：新增 ${stats.additions} 行，删除 ${stats.deletions} 行。`,
    "确认后我才会写入文件。",
  ].join("\n");
}

export function formatToolResultSummary(result: ToolResult): string {
  if (isRunCommandToolResult(result)) {
    return formatRunCommandResult(result);
  }

  if (isPatchFileToolResult(result)) {
    return formatPatchFileResult(result);
  }

  return readString(result.message) || "工具已返回结果。";
}

function formatRunCommandResult(result: Extract<ToolResult, { action: "run_command" }>): string {
  if (result.status === "completed") {
    const lines = ["命令已执行完成。"];

    if (result.command) {
      lines.push(`命令：${result.command}`);
    }

    if (result.timedOut) {
      lines.push("执行过程中超时，系统已主动停止。");
    } else if (typeof result.exitCode === "number") {
      lines.push(`退出码 ${result.exitCode}`);
    }

    const output = pickCommandOutput(result.stdout, result.stderr);

    if (output) {
      lines.push(`输出摘要：${output}`);
    } else {
      lines.push("没有返回需要特别展示的输出。");
    }

    return lines.join("\n");
  }

  if (result.reason === "approval_required") {
    return "这条命令需要先确认，但当前还无法发起确认，所以先跳过了。";
  }

  return "这次没有执行命令，已按你的确认结果取消。";
}

function formatPatchFileResult(result: Extract<ToolResult, { action: "patch_file" }>): string {
  const stats = getDiffStats(result.diff);

  if (result.status === "completed") {
    return [
      `文件已更新：${result.path || "未提供路径"}`,
      `变更摘要：新增 ${stats.additions} 行，删除 ${stats.deletions} 行。`,
    ].join("\n");
  }

  if (result.status === "skipped") {
    return `没有检测到文件变化，已跳过：${result.path || "未提供路径"}`;
  }

  return `这次没有改动文件，已取消：${result.path || "未提供路径"}`;
}

function pickCommandOutput(stdout: string, stderr: string): string {
  const normalizedStdout = normalizeInlineText(stdout);
  const normalizedStderr = normalizeInlineText(stderr);

  if (normalizedStdout) {
    return normalizedStdout;
  }

  if (normalizedStderr) {
    return normalizedStderr;
  }

  return "";
}

function getDiffStats(diff: string): DiffStats {
  const lines = diff.split(/\r?\n/);
  let additions = 0;
  let deletions = 0;

  for (const line of lines) {
    if (line.startsWith("+++")) {
      continue;
    }

    if (line.startsWith("---")) {
      continue;
    }

    if (line.startsWith("+")) {
      additions += 1;
      continue;
    }

    if (line.startsWith("-")) {
      deletions += 1;
    }
  }

  return {
    additions,
    deletions,
  };
}

function normalizeInlineText(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 120);
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}
