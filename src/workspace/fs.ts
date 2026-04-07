import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export function safeResolveWorkspacePath(cwd: string, targetPath: string): string {
  const workspaceRoot = path.resolve(cwd);
  const resolvedPath = path.resolve(workspaceRoot, targetPath);
  const relativePath = path.relative(workspaceRoot, resolvedPath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error("路径越界");
  }

  return resolvedPath;
}

export async function listWorkspaceFiles(cwd: string): Promise<string[]> {
  const root = path.resolve(cwd);
  const results: string[] = [];

  async function walk(currentDir: string) {
    const entries = await readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        if (entry.name === ".git" || entry.name === "node_modules") {
          continue;
        }

        await walk(absolutePath);
        continue;
      }

      results.push(path.relative(root, absolutePath));
    }
  }

  await walk(root);

  return results.sort();
}

export async function readWorkspaceFile(cwd: string, targetPath: string) {
  const resolvedPath = safeResolveWorkspacePath(cwd, targetPath);
  const content = await readFile(resolvedPath, "utf8");

  return {
    path: resolvedPath,
    content,
  };
}

export async function searchWorkspaceText(cwd: string, query: string) {
  const files = await listWorkspaceFiles(cwd);
  const results: Array<{ path: string; lineNumber: number; lineText: string }> = [];

  for (const file of files) {
    const resolvedPath = safeResolveWorkspacePath(cwd, file);
    const content = await readFile(resolvedPath, "utf8");
    const lines = content.split(/\r?\n/);

    lines.forEach((lineText, index) => {
      if (lineText.includes(query)) {
        results.push({
          path: resolvedPath,
          lineNumber: index + 1,
          lineText,
        });
      }
    });
  }

  return results;
}
