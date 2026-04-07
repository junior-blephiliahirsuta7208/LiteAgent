import { collectProviderStream, type Provider, type ProviderRequest, type ProviderResponse, type ProviderStreamEvent } from "../providers/base";
import type { SessionRecord, ToolCallRecord } from "../types";
import { createToolRegistry } from "../tools/registry";
import type { ToolResult } from "../tools/tool-types";

type ToolRegistry = ReturnType<typeof createToolRegistry>;

type RunAgentTurnInput = {
  provider: Provider;
  registry: ToolRegistry;
  session: SessionRecord;
  userInput: string;
  systemPrompt?: string;
  onTextDelta?: (text: string) => void;
  onToolResult?: (result: ToolResult) => void;
};

function appendMessage(
  session: SessionRecord,
  role: SessionRecord["messages"][number]["role"],
  content: string,
  extra: Partial<SessionRecord["messages"][number]> = {},
) {
  session.messages.push({
    role,
    content,
    createdAt: new Date().toISOString(),
    ...extra,
  });
}

export async function runAgentTurn(input: RunAgentTurnInput) {
  appendMessage(input.session, "user", input.userInput);
  const toolResults: ToolResult[] = [];

  while (true) {
    const providerRequest: ProviderRequest = {
      messages: input.session.messages.map((message) => ({
        role: message.role,
        content: message.content,
        toolCallId: message.toolCallId,
        toolCalls: message.toolCalls,
      })),
      systemPrompt: input.systemPrompt,
      tools: input.registry.list().map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    };
    const response: ProviderResponse = input.provider.stream
      ? await collectProviderStream(
          (async function* (): AsyncIterable<ProviderStreamEvent> {
            for await (const event of input.provider.stream!(providerRequest)) {
              if (event.type === "text-delta") {
                input.onTextDelta?.(event.text);
              }

              yield event;
            }
          })(),
        )
      : await input.provider.send(providerRequest);

    if (response.toolCalls.length === 0) {
      appendMessage(input.session, "assistant", response.outputText);

      return {
        outputText: response.outputText,
        session: input.session,
        toolResults,
      };
    }

    appendMessage(input.session, "assistant", response.outputText, {
      toolCalls: response.toolCalls as ToolCallRecord[],
    });

    for (const toolCall of response.toolCalls) {
      const tool = input.registry.get(toolCall.name);

      if (!tool) {
        throw new Error(`未注册工具: ${toolCall.name}`);
      }

      const result = await tool.run(toolCall.arguments);
      toolResults.push(result);
      input.onToolResult?.(result);

      appendMessage(
        input.session,
        "tool",
        JSON.stringify({
          id: toolCall.id,
          name: toolCall.name,
          result,
        }),
        {
          toolCallId: toolCall.id,
        },
      );
    }
  }
}
