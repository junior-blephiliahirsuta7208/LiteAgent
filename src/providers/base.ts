export type ProviderMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCallId?: string;
  toolCalls?: ProviderToolCall[];
};

export type ProviderToolCall = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
};

export type ProviderTool = {
  name: string;
  description: string;
  inputSchema: object;
};

export type ProviderRequest = {
  messages: ProviderMessage[];
  systemPrompt?: string;
  tools?: ProviderTool[];
};

export type ProviderResponse = {
  outputText: string;
  toolCalls: ProviderToolCall[];
};

export type ProviderStreamEvent =
  | {
      type: "text-delta";
      text: string;
    }
  | {
      type: "tool-call-delta";
      index: number;
      id?: string;
      nameDelta?: string;
      argumentsTextDelta?: string;
    };

export async function collectProviderStream(
  stream: AsyncIterable<ProviderStreamEvent>,
): Promise<ProviderResponse> {
  let outputText = "";
  const toolCallParts = new Map<number, { id: string; name: string; argumentsText: string }>();

  for await (const event of stream) {
    if (event.type === "text-delta") {
      outputText += event.text;
      continue;
    }

    const current = toolCallParts.get(event.index) ?? {
      id: "",
      name: "",
      argumentsText: "",
    };

    if (typeof event.id === "string") {
      current.id = event.id;
    }

    if (typeof event.nameDelta === "string") {
      current.name += event.nameDelta;
    }

    if (typeof event.argumentsTextDelta === "string") {
      current.argumentsText += event.argumentsTextDelta;
    }

    toolCallParts.set(event.index, current);
  }

  return {
    outputText,
    toolCalls: [...toolCallParts.entries()]
      .sort(([leftIndex], [rightIndex]) => leftIndex - rightIndex)
      .map(([, toolCall]) => ({
        id: toolCall.id,
        name: toolCall.name,
        arguments: JSON.parse(toolCall.argumentsText || "{}") as Record<string, unknown>,
      })),
  };
}

export type Provider = {
  send(input: ProviderRequest): Promise<ProviderResponse>;
  stream?(input: ProviderRequest): AsyncIterable<ProviderStreamEvent>;
};
