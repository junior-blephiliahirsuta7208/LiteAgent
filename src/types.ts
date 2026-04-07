export type MessageRole = "system" | "user" | "assistant" | "tool";

export type ToolCallRecord = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
};

export type SessionMessage = {
  role: MessageRole;
  content: string;
  createdAt: string;
  toolCallId?: string;
  toolCalls?: ToolCallRecord[];
};

export type SessionRecord = {
  id: string;
  cwd: string;
  messages: SessionMessage[];
  createdAt: string;
};
