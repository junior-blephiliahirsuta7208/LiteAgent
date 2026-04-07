import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

type WorkspaceListOptions = {
  directory?: string;
  limit?: number;
};

type WorkspaceReadOptions = {
  startLine?: number;
  endLine?: number;
};

type WorkspaceSearchOptions = WorkspaceListOptions;

export function safeResolveWorkspacePath(cwd: string, targetPath: string): string {
  const workspaceRoot = path.resolve(cwd);
  const resolvedPath = path.resolve(workspaceRoot, targetPath);
  const relativePath = path.relative(workspaceRoot, resolvedPath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error("路径越界");
  }

  return resolvedPath;
}

function normalizeLimit(limit: number | undefined): number | undefined {
  if (limit === undefined || !Number.isFinite(limit)) {
    return undefined;
  }

  const normalizedLimit = Math.floor(limit);

  return normalizedLimit > 0 ? normalizedLimit : undefined;
}

function isIgnoredDirectory(directoryName: string): boolean {
  return directoryName === ".git" || directoryName === "node_modules";
}

function isBinaryBuffer(buffer: Buffer): boolean {
  return buffer.includes(0);
}

function sliceLines(content: string, options: WorkspaceReadOptions): string {
  if (options.startLine === undefined && options.endLine === undefined) {
    return content;
  }

  const lines = content.split(/\r?\n/);
  const startLine = Math.max(1, Math.floor(options.startLine ?? 1));
  const endLine = Math.max(startLine, Math.floor(options.endLine ?? lines.length));

  return lines.slice(startLine - 1, endLine).join("\n");
}

export async function listWorkspaceFiles(
  cwd: string,
  options: WorkspaceListOptions = {},
): Promise<string[]> {
  const workspaceRoot = path.resolve(cwd);
  const baseDir = options.directory
    ? safeResolveWorkspacePath(cwd, options.directory)
    : workspaceRoot;
  const normalizedLimit = normalizeLimit(options.limit);
  const results: string[] = [];

  async function walk(currentDir: string) {
    if (normalizedLimit !== undefined && results.length >= normalizedLimit) {
      return;
    }

    const entries = await readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      if (normalizedLimit !== undefined && results.length >= normalizedLimit) {
        return;
      }

      const absolutePath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        if (isIgnoredDirectory(entry.name)) {
          continue;
        }

        await walk(absolutePath);
        continue;
      }

      results.push(path.relative(workspaceRoot, absolutePath));
    }
  }

  await walk(baseDir);

  return results.sort();
}

export async function readWorkspaceFile(
  cwd: string,
  targetPath: string,
  options: WorkspaceReadOptions = {},
) {
  const resolvedPath = safeResolveWorkspacePath(cwd, targetPath);
  const content = await readFile(resolvedPath, "utf8");

  return {
    path: resolvedPath,
    content: sliceLines(content, options),
  };
}

export async function searchWorkspaceText(
  cwd: string,
  query: string,
  options: WorkspaceSearchOptions = {},
) {
  const files = await listWorkspaceFiles(cwd, {
    directory: options.directory,
  });
  const normalizedLimit = normalizeLimit(options.limit);
  const results: Array<{ path: string; lineNumber: number; lineText: string }> = [];

  for (const file of files) {
    if (normalizedLimit !== undefined && results.length >= normalizedLimit) {
      break;
    }

    const resolvedPath = safeResolveWorkspacePath(cwd, file);
    const buffer = await readFile(resolvedPath);

    if (isBinaryBuffer(buffer)) {
      continue;
    }

    const content = buffer.toString("utf8");
    const lines = content.split(/\r?\n/);

    for (let index = 0; index < lines.length; index += 1) {
      if (normalizedLimit !== undefined && results.length >= normalizedLimit) {
        break;
      }

      const lineText = lines[index] ?? "";

      if (lineText.includes(query)) {
        results.push({
          path: resolvedPath,
          lineNumber: index + 1,
          lineText,
        });
      }
    }
  }

  return results;
}
