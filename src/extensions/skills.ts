import type { RuntimeExtension } from "./base";

export function createSkillsExtension(enabled: boolean): RuntimeExtension {
  return {
    name: "skills",
    enabled,
    description: enabled
      ? "Skills 扩展已启用，运行时允许附加技能层提示。"
      : "Skills 扩展未启用。",
    systemPrompt: enabled
      ? [
          "Skills extension is enabled.",
          "When a matching runtime skill is available, follow its constraints and prefer the skill-backed workflow over ad-hoc behavior.",
        ].join(" ")
      : undefined,
  };
}
