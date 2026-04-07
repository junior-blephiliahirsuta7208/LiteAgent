import type { RuntimeExtension } from "./base";
import { discoverSkillsWithErrors } from "./skill-loader";

export function createSkillsExtension(
  enabled: boolean,
  cwd = process.cwd(),
): RuntimeExtension {
  const discovery = enabled ? discoverSkillsWithErrors(cwd) : { items: [], errors: [] };
  const { items, errors } = discovery;

  return {
    name: "skills",
    enabled,
    description: enabled
      ? `Skills 扩展已启用，发现 ${items.length} 个技能入口。`
      : "Skills 扩展未启用。",
    items,
    errors,
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
