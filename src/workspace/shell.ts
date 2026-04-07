import { spawn } from "node:child_process";

export function splitCommand(input: string): string[] {
  const args: string[] = [];
  let current = "";
  let activeQuote: "'" | '"' | null = null;
  let tokenStarted = false;

  const pushCurrent = () => {
    if (!tokenStarted) {
      return;
    }

    args.push(current);
    current = "";
    tokenStarted = false;
  };

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];

    if (char === "\\") {
      const nextChar = input[index + 1];

      if (nextChar === undefined) {
        throw new Error("命令不能以转义符结尾");
      }

      if (shouldEscapeCharacter(nextChar, activeQuote)) {
        current += nextChar;
        tokenStarted = true;
        index += 1;
        continue;
      }

      current += char;
      tokenStarted = true;
      continue;
    }

    if (activeQuote) {
      if (char === activeQuote) {
        activeQuote = null;
        tokenStarted = true;
        continue;
      }

      current += char;
      tokenStarted = true;
      continue;
    }

    if (char === "'" || char === '"') {
      activeQuote = char;
      tokenStarted = true;
      continue;
    }

    if (/\s/.test(char)) {
      pushCurrent();
      continue;
    }

    current += char;
    tokenStarted = true;
  }

  if (activeQuote) {
    throw new Error("存在未闭合的引号");
  }

  pushCurrent();

  return args;
}

function shouldEscapeCharacter(nextChar: string, activeQuote: "'" | '"' | null): boolean {
  if (activeQuote === null) {
    return /\s/.test(nextChar) || nextChar === "'" || nextChar === '"' || nextChar === "\\";
  }

  return nextChar === activeQuote || nextChar === "\\";
}

export function truncateCommandOutput(output: string, maxLength: number): string {
  return output.length > maxLength ? output.slice(0, maxLength) : output;
}

export async function runWorkspaceCommand(input: {
  command: string;
  cwd: string;
  timeoutMs: number;
  maxOutput: number;
}) {
  const [file, ...args] = splitCommand(input.command);

  if (!file) {
    throw new Error("命令不能为空");
  }

  return await new Promise<{
    stdout: string;
    stderr: string;
    exitCode: number | null;
    timedOut: boolean;
  }>((resolve, reject) => {
    const child = spawn(file, args, {
      cwd: input.cwd,
      shell: false,
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, input.timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout = truncateCommandOutput(`${stdout}${chunk.toString()}`, input.maxOutput);
    });

    child.stderr.on("data", (chunk) => {
      stderr = truncateCommandOutput(`${stderr}${chunk.toString()}`, input.maxOutput);
    });

    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on("close", (exitCode) => {
      clearTimeout(timer);
      resolve({
        stdout,
        stderr,
        exitCode,
        timedOut,
      });
    });
  });
}
