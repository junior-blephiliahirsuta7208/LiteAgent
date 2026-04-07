import { discoverSkillsWithErrors } from "../extensions/skill-loader";

type SkillsCommandOptions = {
  cwd: string;
};

export type SkillsCommandResult = {
  output: string;
  exitCode: number;
};

export async function runSkillsCommand(
  args: string[],
  options: SkillsCommandOptions,
): Promise<SkillsCommandResult> {
  const [subcommand = "list", skillName] = args;
  const discovery = discoverSkillsWithErrors(options.cwd);

  if (subcommand === "list") {
    return {
      output: formatSkillsList(discovery.items, discovery.errors),
      exitCode: 0,
    };
  }

  if (subcommand === "show") {
    if (!skillName) {
      return {
        output: "用法: liteagent skills show <name>",
        exitCode: 1,
      };
    }

    const skill = discovery.items.find((item) => item.name === skillName);

    if (!skill) {
      return {
        output: `未找到 skill: ${skillName}`,
        exitCode: 1,
      };
    }

    return {
      output: [
        `名称：${skill.name}`,
        ...(skill.description ? [`说明：${skill.description}`] : []),
        ...(skill.entryPath ? [`路径：${skill.entryPath}`] : []),
        "",
        "内容：",
        skill.content,
      ].join("\n"),
      exitCode: 0,
    };
  }

  return {
    output: "用法: liteagent skills <list|show <name>>",
    exitCode: 1,
  };
}

function formatSkillsList(
  items: Array<{ name: string; description?: string; entryPath?: string }>,
  errors: string[],
): string {
  if (items.length === 0) {
    return errors.length > 0
      ? ["暂无可用 skills。", "", "错误 / 警告", ...errors.map((error) => `- ${error}`)].join("\n")
      : "暂无可用 skills。";
  }

  const lines = ["当前 skills", ""];

  for (const [index, item] of items.entries()) {
    lines.push(`${index + 1}. ${item.name}`);

    if (item.description) {
      lines.push(`   ${item.description}`);
    }

    if (item.entryPath) {
      lines.push(`   ${item.entryPath}`);
    }
  }

  if (errors.length > 0) {
    lines.push("");
    lines.push("错误 / 警告");

    for (const error of errors) {
      lines.push(`- ${error}`);
    }
  }

  return lines.join("\n");
}
