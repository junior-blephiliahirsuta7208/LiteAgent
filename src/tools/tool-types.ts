export type ToolResult = Record<string, unknown>;

export type ToolDefinition = {
  name: string;
  description: string;
  inputSchema: object;
  run(args: unknown): Promise<ToolResult>;
};
