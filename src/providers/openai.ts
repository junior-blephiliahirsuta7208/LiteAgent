import OpenAI from "openai";

import {
  collectProviderStream,
  type Provider,
  type ProviderMessage,
  type ProviderRequest,
  type ProviderStreamEvent,
  type ProviderTool,
  type ProviderToolCall,
} from "./base";

type OpenAIProviderConfig = {
  apiKey: string;
  model: string;
  baseUrl?: string;
};

type BuildChatCompletionsRequestInput = {
  model: string;
  messages: ProviderMessage[];
  systemPrompt?: string;
  tools?: ProviderTool[];
};

type ChatCompletionsClient = {
  chat: {
    completions: {
      create: (payload: Record<string, unknown>) => Promise<any>;
    };
  };
};

type ChatCompletionToolCall = {
  id: string;
  type?: string;
  function?: {
    name: string;
    arguments: string;
  };
};

type ChatCompletionMessage = {
  content?: unknown;
  tool_calls?: ChatCompletionToolCall[];
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: ChatCompletionMessage;
  }>;
};

type ChatCompletionDeltaToolCall = {
  index: number;
  id?: string;
  function?: {
    name?: string;
    arguments?: string;
  };
};

type ChatCompletionChunk = {
  choices?: Array<{
    delta?: {
      content?: unknown;
      tool_calls?: ChatCompletionDeltaToolCall[];
    };
  }>;
};

export function buildChatCompletionsRequest(input: BuildChatCompletionsRequestInput) {
  const messages: Array<Record<string, unknown>> = [];

  if (input.systemPrompt) {
    messages.push({
      role: "system",
      content: input.systemPrompt,
    });
  }

  for (const message of input.messages) {
    if (message.role === "tool") {
      messages.push({
        role: "tool",
        content: message.content,
        tool_call_id: message.toolCallId,
      });
      continue;
    }

    if (message.role === "assistant" && message.toolCalls?.length) {
      messages.push({
        role: "assistant",
        content: message.content || null,
        tool_calls: message.toolCalls.map((toolCall) => ({
          id: toolCall.id,
          type: "function",
          function: {
            name: toolCall.name,
            arguments: JSON.stringify(toolCall.arguments),
          },
        })),
      });
      continue;
    }

    messages.push({
      role: message.role,
      content: message.content,
    });
  }

  const tools = input.tools?.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema,
    },
  }));

  return {
    model: input.model,
    messages,
    tools,
    tool_choice: tools?.length ? "auto" : undefined,
    parallel_tool_calls: false,
  };
}

function extractAssistantText(message: { content?: unknown } | undefined): string {
  if (!message) {
    return "";
  }

  if (typeof message.content === "string") {
    return message.content;
  }

  if (Array.isArray(message.content)) {
    return message.content
      .map((part) => {
        if (typeof part === "object" && part !== null && "text" in part) {
          return typeof part.text === "string" ? part.text : "";
        }

        return "";
      })
      .join("");
  }

  return "";
}

function extractDeltaText(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "object" && part !== null && "text" in part) {
          return typeof part.text === "string" ? part.text : "";
        }

        return "";
      })
      .join("");
  }

  return "";
}

function extractToolCalls(toolCalls: ChatCompletionToolCall[] | undefined): ProviderToolCall[] {
  return (toolCalls ?? [])
    .filter((toolCall): toolCall is ChatCompletionToolCall & { type: "function"; function: { name: string; arguments: string } } => {
      return toolCall.type === "function";
    })
    .map((toolCall) => ({
      id: toolCall.id,
      name: toolCall.function.name,
      arguments: JSON.parse(toolCall.function.arguments || "{}") as Record<string, unknown>,
    }));
}

function extractResponse(message: ChatCompletionMessage | undefined) {
  return {
    outputText: extractAssistantText(message),
    toolCalls: extractToolCalls(message?.tool_calls),
  };
}

async function* streamChatCompletions(
  client: ChatCompletionsClient,
  payload: Record<string, unknown>,
): AsyncIterable<ProviderStreamEvent> {
  const stream = (await client.chat.completions.create({
    ...payload,
    stream: true,
  })) as AsyncIterable<ChatCompletionChunk>;

  for await (const chunk of stream) {
    const choice = Array.isArray(chunk.choices) ? chunk.choices[0] : undefined;
    const text = extractDeltaText(choice?.delta?.content);

    if (text) {
      yield {
        type: "text-delta",
        text,
      };
    }

    for (const partialToolCall of choice?.delta?.tool_calls ?? []) {
      const event: ProviderStreamEvent = {
        type: "tool-call-delta",
        index: partialToolCall.index,
        ...(partialToolCall.id ? { id: partialToolCall.id } : {}),
        ...(partialToolCall.function?.name !== undefined ? { nameDelta: partialToolCall.function.name } : {}),
        ...(partialToolCall.function?.arguments !== undefined
          ? { argumentsTextDelta: partialToolCall.function.arguments }
          : {}),
      };

      yield event;
    }
  }
}

export function createOpenAIProvider(
  config: OpenAIProviderConfig,
  injectedClient?: ChatCompletionsClient,
): Provider {
  const client =
    injectedClient ??
    new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });

  function buildPayload(input: ProviderRequest) {
    return buildChatCompletionsRequest({
      model: config.model,
      messages: input.messages,
      systemPrompt: input.systemPrompt,
      tools: input.tools,
    });
  }

  return {
    stream(input) {
      return streamChatCompletions(client as never, buildPayload(input));
    },
    async send(input) {
      const payload = buildPayload(input);
      const response = (await client.chat.completions.create(payload as any)) as ChatCompletionResponse;
      const parsedResponse = extractResponse(response.choices?.[0]?.message);

      if (parsedResponse.outputText || parsedResponse.toolCalls.length > 0) {
        return parsedResponse;
      }

      return await collectProviderStream(streamChatCompletions(client as never, payload));
    },
  };
}
