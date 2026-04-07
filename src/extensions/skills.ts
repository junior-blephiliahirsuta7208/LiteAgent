import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import type { RuntimeExtension, RuntimeExtensionItem } from "./base";

function discoverSkills(cwd: string): RuntimeExtensionItem[] {
  const skillsRoot = path.join(cwd, "skills");

  if (!existsSync(skillsRoot)) {
    return [];
  }

  const items: RuntimeExtensionItem[] = [];

  for (const entry of readdirSync(skillsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const entryPath = path.join(skillsRoot, entry.name, "SKILL.md");

    if (!existsSync(entryPath)) {
      continue;
    }

    const content = readFileSync(entryPath, "utf8");
    const frontmatterNameMatch = content.match(/^name:\s*(.+)$/m);

    items.push({
      name: frontmatterNameMatch?.[1]?.trim() || entry.name,
      source: "skills",
      entryPath,
    });
  }

  return items;
}

export function createSkillsExtension(
  enabled: boolean,
  cwd = process.cwd(),
): RuntimeExtension {
  const items = enabled ? discoverSkills(cwd) : [];

  return {
    name: "skills",
    enabled,
    description: enabled
      ? `Skills 扩展已启用，发现 ${items.length} 个技能入口。`
      : "Skills 扩展未启用。",
    items,
    systemPrompt: enabled
      ? [
          "Skills extension is enabled.",
          items.length > 0
            ? `Discovered skills: ${items.map((item) => item.name).join(", ")}.`
            : "No skill entry was discovered under skills/<name>/SKILL.md.",
          "When a matching runtime skill is available, follow its constraints and prefer the skill-backed workflow over ad-hoc behavior.",
        ].join(" ")
      : undefined,
  };
}
