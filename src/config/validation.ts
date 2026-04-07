import type { RuntimeConfig } from "./config";

export type ConfigIssueCode = "missing_required" | "invalid_positive_number" | "invalid_url";

export type ConfigIssue = {
  path: "OPENAI_API_KEY" | "OPENAI_BASE_URL" | "COMMAND_TIMEOUT_MS" | "MAX_COMMAND_OUTPUT";
  code: ConfigIssueCode;
  message: string;
  suggestion: string;
  received?: string;
};

export type ConfigValidationResult = {
  ok: boolean;
  issues: ConfigIssue[];
};

function describeNumber(value: number): string {
  if (Number.isNaN(value)) {
    return "NaN";
  }

  if (!Number.isFinite(value)) {
    return value > 0 ? "Infinity" : "-Infinity";
  }

  return String(value);
}

function isValidPositiveNumber(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function isValidBaseUrl(value: string | undefined): boolean {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);

    return (url.protocol === "http:" || url.protocol === "https:") && Boolean(url.host);
  } catch {
    return false;
  }
}

export function getConfigIssues(config: RuntimeConfig): ConfigIssue[] {
  const issues: ConfigIssue[] = [];

  if (!config.apiKey) {
    issues.push({
      path: "OPENAI_API_KEY",
      code: "missing_required",
      message: "缺少 OpenAI API Key，程序无法创建模型提供方。",
      suggestion: "请设置环境变量 OPENAI_API_KEY，例如设置为你的平台密钥。",
    });
  }

  if (!isValidPositiveNumber(config.commandTimeoutMs)) {
    issues.push({
      path: "COMMAND_TIMEOUT_MS",
      code: "invalid_positive_number",
      message: "命令超时时间必须是大于 0 的有效数字。",
      suggestion: "请将 COMMAND_TIMEOUT_MS 设置为正数，例如 15000。",
      received: describeNumber(config.commandTimeoutMs),
    });
  }

  if (!isValidPositiveNumber(config.maxCommandOutput)) {
    issues.push({
      path: "MAX_COMMAND_OUTPUT",
      code: "invalid_positive_number",
      message: "命令输出上限必须是大于 0 的有效数字。",
      suggestion: "请将 MAX_COMMAND_OUTPUT 设置为正数，例如 12000。",
      received: describeNumber(config.maxCommandOutput),
    });
  }

  if (!isValidBaseUrl(config.baseUrl)) {
    issues.push({
      path: "OPENAI_BASE_URL",
      code: "invalid_url",
      message: "自定义 OpenAI Base URL 格式不合法。",
      suggestion: "请提供 http:// 或 https:// 开头的完整地址，例如 https://api.openai.com/v1。",
      received: config.baseUrl,
    });
  }

  return issues;
}

export function validateConfig(config: RuntimeConfig): ConfigValidationResult {
  const issues = getConfigIssues(config);

  return {
    ok: issues.length === 0,
    issues,
  };
}
