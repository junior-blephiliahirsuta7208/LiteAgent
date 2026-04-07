import type { ToolDefinition } from "./tool-types";

type AskUserToolOptions = {
  ask?: (question: string) => Promise<string>;
};

export function createAskUserTool(options: AskUserToolOptions = {}): ToolDefinition {
  return {
    name: "ask_user",
    description: "向用户提出澄清问题",
    inputSchema: {
      type: "object",
      properties: {
        question: {
          type: "string",
        },
      },
      required: ["question"],
      additionalProperties: false,
    },
    async run(args) {
      const question = typeof args === "object" && args !== null ? (args as { question?: string }).question : undefined;
      const answer = await options.ask?.(question ?? "");

      return {
        question: question ?? "",
        answered: answer !== undefined,
        answer,
      };
    },
  };
}
