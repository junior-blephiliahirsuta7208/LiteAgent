export type RuntimeExtensionName = "mcp" | "skills";

export type RuntimeExtensionItem = {
  name: string;
  source?: string;
  entryPath?: string;
  transport?: string;
};

export type RuntimeExtension = {
  name: RuntimeExtensionName;
  enabled: boolean;
  description: string;
  systemPrompt?: string;
  items?: RuntimeExtensionItem[];
};

export type RuntimeExtensionsState = {
  all: RuntimeExtension[];
  enabled: RuntimeExtension[];
};

export function createRuntimeExtensionsState(
  extensions: RuntimeExtension[],
): RuntimeExtensionsState {
  return {
    all: extensions,
    enabled: extensions.filter((extension) => extension.enabled),
  };
}

export function buildExtensionSystemPrompt(
  extensions: RuntimeExtension[],
): string | undefined {
  const sections = extensions
    .filter((extension) => extension.enabled && extension.systemPrompt)
    .map((extension) => extension.systemPrompt?.trim())
    .filter((section): section is string => Boolean(section));

  return sections.length > 0 ? sections.join("\n\n") : undefined;
}
