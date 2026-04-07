import type { LoadSkillToolResult, ToolDefinition } from "./tool-types";
import { discoverSkillsWithErrors } from "../extensions/skill-loader";

export function createLoadSkillTool(cwd: string): ToolDefinition<LoadSkillToolResult> {
  return {
    name: "load_skill",
    description: "按 skill 名称加载 skills/<name>/SKILL.md 内容",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
        },
      },
      required: ["name"],
      additionalProperties: false,
    },
    async run(args) {
      const input =
        typeof args === "object" && args !== null
          ? (args as { name?: string })
          : {};
      const skillName = input.name?.trim() ?? "";
      const discovery = discoverSkillsWithErrors(cwd);
      const matchedSkill = discovery.items.find((item) => item.name === skillName);

      if (!skillName || !matchedSkill) {
        return {
          found: false,
          skillName: skillName || "<empty>",
          message: `未找到 skill: ${skillName || "<empty>"}`,
          availableSkills: discovery.items.map((item) => item.name),
          errors: discovery.errors,
        };
      }

      return {
        found: true,
        skillName: matchedSkill.name,
        entryPath: matchedSkill.entryPath,
        description: matchedSkill.description,
        content: matchedSkill.content,
      };
    },
  };
}
