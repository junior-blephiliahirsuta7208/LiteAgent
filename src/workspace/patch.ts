import { writeFile } from "node:fs/promises";

export function buildUnifiedDiffPreview(before: string, after: string, filePath: string): string {
  const beforeLines = before.replace(/\n$/, "").split(/\r?\n/);
  const afterLines = after.replace(/\n$/, "").split(/\r?\n/);

  return [
    `--- ${filePath}`,
    `+++ ${filePath}`,
    ...beforeLines.map((line) => `-${line}`),
    ...afterLines.map((line) => `+${line}`),
  ].join("\n");
}

export async function applyApprovedPatch(filePath: string, nextContent: string): Promise<void> {
  await writeFile(filePath, nextContent, "utf8");
}
